import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import { createContext } from 'react';

import type { CodeDocument } from '../editor/codeModel';
import styles from '../styles.module.css';

// The router's side of the preview's header, kept apart from the router
// (./router.tsx): ../index.tsx renders the header in every page chunk that
// embeds a Playground, and its loading frame shows these controls as the
// router will, at its start

/** Where the router renders its controls: a slot in the preview's header,
 * so they take no room from the demo */
export const RouterControlsSlot = createContext<HTMLElement | null>(null);

/** The page a router opens on unless a document names another (`start`) */
export const DEFAULT_START = '/';

/** The page the documents' router opens on, if they declare `route`s */
export function routerStartOf(documents: readonly CodeDocument[]) {
  if (!documents.some(document => document.route)) return;
  return documents.find(document => document.start)?.start ?? DEFAULT_START;
}

/** Back, Home and the page shown */
export function RouterControls({
  path,
  atRoot,
  pending,
  onBack,
  onHome,
}: {
  path: string;
  atRoot: boolean;
  pending: boolean;
  /** absent while the preview loads, at its start */
  onBack?: () => void;
  onHome?: () => void;
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
