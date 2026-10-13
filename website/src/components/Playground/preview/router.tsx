import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, {
  createContext,
  Suspense,
  use,
  useCallback,
  useState,
  type ComponentType,
} from 'react';

import type { CodeDocument } from '../editor/codeModel';
import { defaultExportName } from './transformCode';
import { Loading } from '../DesignSystem/Loading';
import styles from '../styles.module.css';

/** Scope name the code's trailer renders; never typed by users */
export const ROUTER = '__PlaygroundRouter';

type Route = readonly [pattern: string, Page: ComponentType<any> | undefined];

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
        event.preventDefault();
        navigate(to);
      }}
    />
  );
}
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
}

/** Starts at `/`, under an address bar whose Back returns to the page before */
export function Router({ routes }: { routes: readonly Route[] }) {
  const [history, setHistory] = useState(['/']);
  const navigate = useCallback(
    (to: string) =>
      setHistory(paths => (paths.at(-1) === to ? paths : [...paths, to])),
    [],
  );
  const path = history[history.length - 1];
  return (
    <NavigateContext value={navigate}>
      <div className={styles.addressBar}>
        <button
          type="button"
          className={clsx(styles.headerButton, styles.addressBack)}
          aria-label={translate({
            id: 'playground.router.back',
            message: 'Back',
          })}
          disabled={history.length === 1}
          onClick={() => setHistory(paths => paths.slice(0, -1))}
        >
          <BackIcon />
        </button>
        <span className={styles.addressPath}>{path}</span>
      </div>
      <Suspense fallback={<Loading />}>{renderPage(routes, path)}</Suspense>
    </NavigateContext>
  );
}

function renderPage(routes: readonly Route[], path: string) {
  for (const [pattern, Page] of routes) {
    const params = matchPath(pattern, path);
    if (!params) continue;
    if (!Page)
      throw new Error(
        `The page for route "${pattern}" must be its file's named default export`,
      );
    return <Page {...params} />;
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
