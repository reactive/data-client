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
  const isSelected = selectedValue === 'y';
  const rotation = isSelected ? '0' : '180';
  return (
    <>
      <div className={styles.debugToggle} onClick={toggle}>
        Store
        <span
          style={{
            transition: 'all 200ms ease 0s',
            transform: `rotateZ(${rotation}deg)`,
            transformOrigin: '45% 50% 0px',
            position: 'relative',
            display: 'inline-block',
            fontSize: '90%',
            float: 'right',
          }}
        >
          ▶
        </span>
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
