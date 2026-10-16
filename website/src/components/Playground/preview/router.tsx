import { ErrorBoundary } from '@data-client/react';
import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, {
  createContext,
  Suspense,
  use,
  useCallback,
  useState,
  useTransition,
  type ComponentType,
} from 'react';
import { createPortal } from 'react-dom';

import { RouterControlsSlot } from './routerSlot';
import { defaultExportName } from './transformCode';
import { ErrorMessage } from '../DesignSystem/ErrorMessage';
import { Loading } from '../DesignSystem/Loading';
import type { CodeDocument } from '../editor/codeModel';
import styles from '../styles.module.css';

/** Scope name the code's trailer renders; never typed by users */
export const ROUTER = '__PlaygroundRouter';

type Route = readonly [
  pattern: string,
  Component: ComponentType<any> | undefined,
];

/** Appended to the preview's code: renders the documents that declare a
 * `route` as the pages of a router, so demos need no navigation code of their
 * own. A page is its document's default export; its path's params are its
 * props. A `layout` document's default export wraps every page, and a
 * `start` path opens the router somewhere other than `/`.
 */
export function routerTrailer(documents: readonly CodeDocument[]) {
  const routes = documents
    .filter(document => document.route)
    .map(
      document => `[${JSON.stringify(document.route)}, ${exportOf(document)}]`,
    );
  if (!routes.length) return '';
  const layout = documents.find(document => document.layout);
  const start = documents.find(document => document.start)?.start;
  const props = [
    `routes={[${routes.join(', ')}]}`,
    ...(layout ? [`layout={${exportOf(layout)}}`] : []),
    ...(start ? [`start={${JSON.stringify(start)}}`] : []),
  ];
  return `\n;render(<${ROUTER} ${props.join(' ')} />);`;
}

const exportOf = (document: CodeDocument) =>
  defaultExportName(document.value) ?? 'undefined';

const NavigateContext = createContext<(to: string) => void>(() => {
  throw new Error('useNavigate() only works in a page with a `route`');
});
/** The path shown, which Links to it mark as current */
const PathContext = createContext<string | undefined>(undefined);

/** Opens `to` in the preview's router */
export function useNavigate() {
  return use(NavigateContext);
}

export function Link({ to, onClick, ...props }: LinkProps) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      aria-current={use(PathContext) === to ? 'page' : undefined}
      {...props}
      onClick={event => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        navigate(to);
      }}
    />
  );
}
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

/** Starts at `start`, with Back, Home and the path shown in the preview's
 * header. Navigation is a transition: the current page stays until the next
 * one is ready, with a progress bar along the preview's top edge meanwhile.
 * `layout` stays mounted around the pages, so what it shows (say, links
 * between them) holds through navigation.
 */
export function Router({
  routes,
  layout: Layout,
  start = '/',
}: {
  routes: readonly Route[];
  layout?: ComponentType<{ children: React.ReactNode }>;
  start?: string;
}) {
  const [history, setHistory] = useState([start]);
  const [pending, startTransition] = useTransition();
  const navigate = useCallback(
    (to: string) =>
      startTransition(() =>
        setHistory(paths => (paths.at(-1) === to ? paths : [...paths, to])),
      ),
    [],
  );
  const controlsSlot = use(RouterControlsSlot);
  const path = history[history.length - 1];
  const atRoot = history.length === 1;
  const page = (
    <Suspense fallback={<Loading />}>
      {/* the header's controls stay usable when a page throws, so Back
          recovers; a new path clears the error. Suspense stays outside this
          key: a newly mounted one would show its fallback rather than hold
          the page */}
      <ErrorBoundary key={path} fallbackComponent={ErrorMessage}>
        <Page routes={routes} path={path} />
      </ErrorBoundary>
    </Suspense>
  );
  return (
    <NavigateContext value={navigate}>
      {controlsSlot &&
        createPortal(
          <RouterControls
            path={path}
            atRoot={atRoot}
            pending={pending}
            onBack={() =>
              // a second click can land before the first commits
              startTransition(() =>
                setHistory(paths =>
                  paths.length > 1 ? paths.slice(0, -1) : paths,
                ),
              )
            }
            onHome={() => startTransition(() => setHistory([start]))}
          />,
          controlsSlot,
        )}
      <div
        className={styles.navProgress}
        data-pending={pending || undefined}
        aria-hidden="true"
      />
      <PathContext value={path}>
        {Layout ?
          <Layout>{page}</Layout>
        : page}
      </PathContext>
    </NavigateContext>
  );
}

/** Back, Home and the page shown */
function RouterControls({
  path,
  atRoot,
  pending,
  onBack,
  onHome,
}: {
  path: string;
  atRoot: boolean;
  pending: boolean;
  onBack: () => void;
  onHome: () => void;
}) {
  const back = translate({ id: 'playground.router.back', message: 'Back' });
  const home = translate({ id: 'playground.router.home', message: 'Home' });
  return (
    <nav
      className={styles.routerControls}
      aria-label={translate({
        id: 'playground.router.pages',
        message: 'Preview pages',
      })}
      aria-busy={pending}
    >
      <button
        type="button"
        className={clsx('clean-btn', styles.headerButton)}
        title={back}
        aria-label={back}
        disabled={atRoot}
        onClick={onBack}
      >
        <BackIcon />
      </button>
      <button
        type="button"
        className={clsx('clean-btn', styles.headerButton)}
        title={home}
        aria-label={home}
        disabled={atRoot}
        onClick={onHome}
      >
        <HomeIcon />
      </button>
      <span className={styles.routerPath} title={path}>
        {path}
      </span>
    </nav>
  );
}

function Page({ routes, path }: { routes: readonly Route[]; path: string }) {
  for (const [pattern, Component] of routes) {
    const params = matchPath(pattern, path);
    if (!params) continue;
    if (!Component)
      throw new Error(
        `The page for route "${pattern}" must be its file's named default export`,
      );
    return <Component {...params} />;
  }
  throw new Error(`No route matches "${path}"`);
}

/** `path`'s params when it fits `pattern` (`/posts/:id`) */
function matchPath(pattern: string, path: string) {
  const segments = pattern.split('/');
  const parts = path.split('/');
  if (segments.length !== parts.length) return;
  const params: Record<string, string> = {};
  for (const [i, segment] of segments.entries()) {
    if (segment.startsWith(':'))
      params[segment.slice(1)] = decodeURIComponent(parts[i]);
    else if (segment !== parts[i]) return;
  }
  return params;
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5m6-6-6 6 6 6" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 11.5 12 5l8 6.5M6.5 9.5V19h11V9.5" />
    </svg>
  );
}
