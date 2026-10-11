// Kept apart from StoreInspector: ../index.tsx is statically in every page
// chunk that embeds a Playground, while the Store UI loads with LivePreview

import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import Translate, { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useCallback } from 'react';

import { useTabStorage } from '../../../utils/tabStorage';
import { useLayoutMotion } from '../../motion';
import styles from '../styles.module.css';

/** Store open state, persisted per `groupId`; toggling keeps the page from scrolling */
export function useStoreOpen(groupId: string, defaultOpen: 'y' | 'n') {
  const [choice, setChoice] = useTabStorage(groupId);
  const open =
    (choice === 'y' || choice === 'n' ? choice : defaultOpen) === 'y';
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();
  const toggle = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      blockElementScrollPositionUntilNextRender(event.currentTarget);
      setChoice(open ? 'n' : 'y');
    },
    [blockElementScrollPositionUntilNextRender, open, setChoice],
  );
  return [open, toggle] as const;
}

/** Toggle row; also rendered (inert) by the preview loading fallback in ../index.tsx */
export function StoreToggle({
  onClick,
  open = true,
}: {
  onClick?: React.MouseEventHandler<HTMLElement>;
  open?: boolean;
}) {
  const ref = useLayoutMotion();
  return (
    <div className={styles.debugToggle} onClick={onClick} ref={ref}>
      <Translate id="playground.store">Store</Translate>
      <span
        className={clsx(
          styles.arrow,
          open ? styles.right : styles.left,
          styles.vertical,
        )}
      >
        ▶
      </span>
    </div>
  );
}

/** The Store toggle in the preview's header, which narrow playgrounds show
 * instead of the side strip (see styles.module.css); also rendered, disabled,
 * by the preview loading fallback in ../index.tsx to hold the layout */
export function StoreHeaderToggle({
  onClick,
  open = false,
}: {
  onClick?: React.MouseEventHandler<HTMLElement>;
  open?: boolean;
}) {
  return (
    <button
      type="button"
      className={clsx(
        'clean-btn',
        styles.headerButton,
        styles.storeHeaderToggle,
      )}
      title={toggleTitle(open)}
      aria-label={translate({ id: 'playground.store', message: 'Store' })}
      aria-pressed={open}
      disabled={!onClick}
      onClick={onClick}
    >
      <StoreIcon />
    </button>
  );
}

/** The Store toggle in the code's corner, for playgrounds whose Store slides
 * over the code: it names what it brings back, and stays put as the Store
 * slides in under it, so a second click finds it where the first left it */
export function StoreBadge({
  onClick,
  open,
}: {
  onClick: React.MouseEventHandler<HTMLElement>;
  open: boolean;
}) {
  return (
    <button
      type="button"
      className={clsx('clean-btn', styles.swap, styles.storeBadge)}
      title={toggleTitle(open)}
      aria-pressed={open}
      data-swapped={open || undefined}
      onClick={onClick}
    >
      <span aria-hidden={open}>
        <span className={styles.storeBadgeDot} />
        <Translate id="playground.store">Store</Translate>
      </span>
      <span aria-hidden={!open}>
        <CodeIcon />
        <Translate id="playground.code">Code</Translate>
      </span>
    </button>
  );
}

const toggleTitle = (open: boolean) =>
  open ?
    translate({ id: 'playground.store.hide', message: 'Hide Store' })
  : translate({ id: 'playground.store.show', message: 'Show Store' });

/** Angle brackets around a slash */
function CodeIcon() {
  return (
    <svg
      className={styles.storeBadgeCode}
      viewBox="0 0 24 24"
      width="1.15em"
      height="1.15em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
    </svg>
  );
}

/** A database cylinder */
function StoreIcon() {
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
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  );
}
