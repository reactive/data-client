import React, { Component, useDeferredValue, useState, memo } from 'react';
import { createPortal } from 'react-dom';

import { Reveal } from '../../motion';
import styles from '../styles.module.css';
import type SchemaRegistry from './store/schemaRegistry';
import StorePanel from './store/StorePanel';
import { heldToggle, StoreToggle, useKeepToggleInPlace } from './StoreToggle';

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
  const keepToggleInPlace = useKeepToggleInPlace();
  const panel = (
    <Reveal show={open} className={styles.storePanel} hold={heldToggle}>
      <BeforeTree shown={showTree} run={keepToggleInPlace}>
        {showTree ?
          <StorePanel registry={registry} history={history} />
        : null}
      </BeforeTree>
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

/** Runs `run` in the commit that adds the tree, before it reaches the DOM: a
 * stacked Store grows to fit it, as does every Store the same toggle opened */
class BeforeTree extends Component<{
  shown: boolean;
  run: () => void;
  children: React.ReactNode;
}> {
  getSnapshotBeforeUpdate(prev: Readonly<BeforeTree['props']>) {
    if (this.props.shown && !prev.shown) this.props.run();
    return null;
  }

  componentDidUpdate() {
    // React wants it beside getSnapshotBeforeUpdate
  }

  render() {
    return this.props.children;
  }
}
