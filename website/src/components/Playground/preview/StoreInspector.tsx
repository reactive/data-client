import React, { useDeferredValue, useState, memo } from 'react';
import { createPortal } from 'react-dom';

import { Reveal } from '../../motion';
import styles from '../styles.module.css';
import type SchemaRegistry from './store/schemaRegistry';
import StorePanel from './store/StorePanel';
import { heldToggle, StoreToggle } from './StoreToggle';

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
  // then stays, so reopening finds the Store as it was left. A row Store
  // renders it with the click instead: where the row playground stacks, that
  // Store grows to fit the tree, and growing a frame later would move the
  // page after the click's scroll hold. Beside the result it has a set height
  const deferred = useDeferredValue(open);
  const ready = row ? open : deferred;
  const [showTree, setShowTree] = useState(false);
  if (ready && !showTree) setShowTree(true);
  const panel = (
    <Reveal show={open} className={styles.storePanel} hold={heldToggle}>
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
