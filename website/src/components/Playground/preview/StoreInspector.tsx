import React, { useDeferredValue, useState, memo } from 'react';
import { createPortal } from 'react-dom';

import { Reveal } from '../../motion';
import styles from '../styles.module.css';
import type SchemaRegistry from './store/schemaRegistry';
import StorePanel from './store/StorePanel';
import { StoreToggle } from './StoreToggle';

function StoreInspector({
  groupId,
  toggle,
  open,
  registry,
  history,
  row,
  host,
}: {
  groupId: string;
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
        <StorePanel groupId={groupId} registry={registry} history={history} />
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
