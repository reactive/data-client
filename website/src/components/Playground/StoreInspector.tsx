import { StateContext } from '@data-client/react';
import clsx from 'clsx';
import React, { useContext, memo, useMemo } from 'react';

import styles from './styles.module.css';
import Tree from './Tree';

function StoreInspector({
  toggle,
  selectedValue,
}: {
  selectedValue: 'y' | 'n';
  toggle: React.MouseEventHandler<HTMLDivElement>;
}) {
  const isSelected = selectedValue === 'y';
  return (
    <>
      <StoreToggle onClick={toggle} open={isSelected} />
      {isSelected ?
        <StoreTreeM />
      : null}
    </>
  );
}
export default memo(StoreInspector);

/** Toggle row shared with the preview loading fallback in ./index.tsx */
export function StoreToggle({
  onClick,
  open = true,
}: {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  open?: boolean;
}) {
  return (
    <div className={styles.debugToggle} onClick={onClick}>
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
