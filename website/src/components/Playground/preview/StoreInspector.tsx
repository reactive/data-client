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
  host,
}: {
  open: boolean;
  toggle: React.MouseEventHandler<HTMLDivElement>;
  registry: SchemaRegistry;
  /** Row layout: the layer over the code the drawer slides into (null until mounted) */
  host?: HTMLElement | null;
}) {
  // the empty drawer starts moving at once; the tree renders a frame later,
  // then stays, so reopening finds the Store as it was left
  const ready = useDeferredValue(open);
  const [showTree, setShowTree] = useState(false);
  if (ready && !showTree) setShowTree(true);
  const panel = (
    <Reveal
      show={open}
      className={clsx(
        styles.storePanel,
        host !== undefined && styles.storeCover,
      )}
    >
      {showTree ?
        <StorePanel registry={registry} />
      : null}
    </Reveal>
  );
  return (
    <>
      <StoreToggle onClick={toggle} open={open} />
      {host === undefined ? panel : host && createPortal(panel, host)}
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
    (event: React.MouseEvent<HTMLDivElement>) => {
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
  onClick?: React.MouseEventHandler<HTMLDivElement>;
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
