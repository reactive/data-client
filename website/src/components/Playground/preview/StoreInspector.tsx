import clsx from 'clsx';
import React, { useDeferredValue, useState, memo } from 'react';

import { Reveal, useLayoutMotion } from '../../motion';
import styles from '../styles.module.css';
import type SchemaRegistry from './store/schemaRegistry';
import StorePanel from './store/StorePanel';

function StoreInspector({
  toggle,
  selectedValue,
  registry,
  history,
}: {
  selectedValue: 'y' | 'n';
  toggle: React.MouseEventHandler<HTMLDivElement>;
  registry: SchemaRegistry;
  history: number;
}) {
  const isSelected = selectedValue === 'y';
  // the empty drawer starts moving at once; the tree renders a frame later,
  // then stays, so reopening finds the Store as it was left
  const ready = useDeferredValue(isSelected);
  const [showTree, setShowTree] = useState(false);
  if (ready && !showTree) setShowTree(true);
  return (
    <>
      <StoreToggle onClick={toggle} open={isSelected} />
      <Reveal show={isSelected} className={styles.storePanel}>
        {showTree ?
          <StorePanel registry={registry} history={history} />
        : null}
      </Reveal>
    </>
  );
}
export default memo(StoreInspector);

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
