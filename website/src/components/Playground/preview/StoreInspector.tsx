import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import clsx from 'clsx';
import React, { useCallback, useDeferredValue, useState, memo } from 'react';
import { createPortal } from 'react-dom';

import { Reveal, useLayoutMotion } from '../../motion';
import styles from '../styles.module.css';
import type SchemaRegistry from './store/schemaRegistry';
import StorePanel from './store/StorePanel';
import { useTabStorage } from '../../../utils/tabStorage';

function StoreInspector({
  toggle,
  open,
  registry,
  history,
  row,
  host,
}: {
  open: boolean;
  toggle: React.MouseEventHandler<HTMLElement>;
  registry: SchemaRegistry;
  history: number;
  /** Slides over the code (into `host`) instead of beside the result */
  row: boolean;
  host: HTMLElement | null;
}) {
  // the empty drawer starts moving at once; the tree renders a frame later,
  // then stays, so reopening finds the Store as it was left
  const ready = useDeferredValue(open);
  const [showTree, setShowTree] = useState(false);
  if (ready && !showTree) setShowTree(true);
  const panel = (
    <Reveal show={open} className={styles.storePanel}>
      {showTree ?
        <StorePanel registry={registry} history={history} />
      : null}
    </Reveal>
  );
  return (
    <>
      <StoreToggle onClick={toggle} open={open} />
      {row ? host && createPortal(panel, host) : panel}
    </>
  );
}
export default memo(StoreInspector);

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
  const close = useCallback(() => setChoice('n'), [setChoice]);
  return [open, toggle, close] as const;
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
      Store
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
 * instead of the side strip (see styles.module.css); also rendered (inert)
 * by the preview loading fallback in ../index.tsx */
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
      title={open ? 'Hide Store' : 'Show Store'}
      aria-label="Store"
      aria-pressed={open}
      onClick={onClick}
    >
      <StoreIcon />
    </button>
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
