import { StateContext } from '@data-client/react';
import clsx from 'clsx';
import React, { useContext, useDeferredValue, memo, useMemo } from 'react';

import { Reveal, useLayoutMotion } from '../../motion';
import styles from '../styles.module.css';
import Tree from './Tree';

function StoreInspector({
  toggle,
  selectedValue,
}: {
  selectedValue: 'y' | 'n';
  toggle: React.MouseEventHandler<HTMLDivElement>;
}) {
  const isSelected = selectedValue === 'y';
  // the empty drawer starts moving at once; the tree renders a frame later
  const showTree = useDeferredValue(isSelected);
  return (
    <>
      <StoreToggle onClick={toggle} open={isSelected} />
      <Reveal show={isSelected} className={styles.storePanel}>
        {showTree ?
          <StoreTreeM />
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

function StoreTree() {
  const state = useContext(StateContext);
  const simplifiedState = useMemo(() => {
    const { optimistic, ...ret } = state;
    return ret;
  }, [state]);
  return <Tree value={simplifiedState} />;
}
const StoreTreeM = memo(StoreTree);
