import { ErrorBoundary } from '@data-client/react';
import { translate } from '@docusaurus/Translate';
import React, {
  createContext,
  Suspense,
  use,
  useCallback,
  useState,
  useTransition,
  type ComponentType,
} from 'react';

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
 * props.
 */
export function routerTrailer(documents: readonly CodeDocument[]) {
  const routes = documents
    .filter(document => document.route)
    .map(
      document =>
        `[${JSON.stringify(document.route)}, ${defaultExportName(document.value) ?? 'undefined'}]`,
    );
  if (!routes.length) return '';
  return `\n;render(<${ROUTER} routes={[${routes.join(', ')}]} />);`;
}

const NavigateContext = createContext<(to: string) => void>(() => {
  throw new Error('useNavigate() only works in a page with a `route`');
});

/** Opens `to` in the preview's router */
export function useNavigate() {
  return use(NavigateContext);
}

export function Link({ to, onClick, ...props }: LinkProps) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
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

/** Starts at `/`, with an address chip floating in the preview's top corner:
 * Back returns to the page before, and the path shows on hover or keyboard
 * focus (on touch, briefly after each navigation).
 * Navigation is a transition: the current page stays until the next one is
 * ready, with a progress bar along the preview's top edge meanwhile.
 */
export function Router({ routes }: { routes: readonly Route[] }) {
  const [history, setHistory] = useState(['/']);
  const [pending, startTransition] = useTransition();
  const navigate = useCallback(
    (to: string) =>
      startTransition(() =>
        setHistory(paths => (paths.at(-1) === to ? paths : [...paths, to])),
      ),
    [],
  );
  const path = history[history.length - 1];
  const atRoot = history.length === 1;
  return (
    <NavigateContext value={navigate}>
      <div
        className={styles.navProgress}
        data-pending={pending || undefined}
        aria-hidden="true"
      />
      <div
        className={styles.addressBar}
        data-root={atRoot || undefined}
        aria-busy={pending}
      >
        <button
          type="button"
          className={styles.addressBack}
          aria-label={translate({
            id: 'playground.router.back',
            message: 'Back',
          })}
          disabled={atRoot}
          onClick={() =>
            // a second click can land before the first commits
            startTransition(() =>
              setHistory(paths =>
                paths.length > 1 ? paths.slice(0, -1) : paths,
              ),
            )
          }
        >
          <BackIcon />
        </button>
        {/* keyed so its touch flash replays on each navigation */}
        <span key={path} className={styles.addressPath}>
          {path}
        </span>
      </div>
      <Suspense fallback={<Loading />}>
        {/* the chip stays usable when a page throws, so Back recovers; a
            new path clears the error. Suspense stays outside this key: a newly
            mounted one would show its fallback rather than hold the page */}
        <ErrorBoundary key={path} fallbackComponent={ErrorMessage}>
          <Page routes={routes} path={path} />
        </ErrorBoundary>
      </Suspense>
    </NavigateContext>
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
