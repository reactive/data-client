import { StateContext } from '@rest-hooks/core';
import React, { useContext, memo, useMemo } from 'react';

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
  return (
    <>
      <div className={styles.debugToggle} onClick={toggle}>
        Store
      </div>
      {selectedValue === 'y' ? <StoreTreeM /> : null}
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
    delete ret.lastReset;
    return ret;
  }, [state]);
  return <Tree value={simplifiedState} />;
}
const StoreTreeM = memo(StoreTree);
