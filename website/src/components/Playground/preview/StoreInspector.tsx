import React, { useDeferredValue, useState, memo } from 'react';
import { createPortal } from 'react-dom';

import { Reveal } from '../../motion';
import styles from '../styles.module.css';
import type SchemaRegistry from './store/schemaRegistry';
import StorePanel from './store/StorePanel';
import { StoreToggle } from './StoreToggle';

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
  // over the code, its toggle is the code's corner badge (../index.tsx)
  return row ?
      host && createPortal(panel, host)
    : <>
        <StoreToggle onClick={toggle} open={open} />
        {panel}
      </>;
}
export default memo(StoreInspector);
