import { StateContext } from '@rest-hooks/core';
import React, { useContext, memo, useMemo } from 'react';
import clsx from 'clsx';

import Tree from './Tree';
import styles from './styles.module.css';

function StoreInspector({
  toggle,
  selectedValue,
}: {
  selectedValue: 'y' | 'n';
  toggle: (
    event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>,
  ) => void;
}) {
  const isSelected = selectedValue === 'y';
  const rotation = isSelected ? styles.right : styles.left;
  return (
    <>
      <div className={styles.debugToggle} onClick={toggle}>
        Store
        <span className={clsx(styles.arrow, rotation, styles.vertical)}>▶</span>
      </div>
      {isSelected ? <StoreTreeM /> : null}
    </>
  );
}
export default memo(StoreInspector);

function StoreTree() {
  const state = useContext(StateContext);
  const simplifiedState = useMemo(() => {
    const ret = {
      ...state,
    };
    delete ret.optimistic;
    return ret;
  }, [state]);
  return <Tree value={simplifiedState} />;
}
const StoreTreeM = memo(StoreTree);
