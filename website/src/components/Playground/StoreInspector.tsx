import { StateContext } from '@rest-hooks/core';
import React, { useContext, memo, useCallback, useMemo } from 'react';
import useUserPreferencesContext from '@theme/hooks/useUserPreferencesContext';

import Tree from './Tree';
import styles from './store.module.css';

function StoreInspector({
  groupId,
  defaultOpen = 'n',
}: {
  groupId: string;
  defaultOpen: 'y' | 'n';
}) {
  const group = `store-open-${groupId}`;
  const { tabGroupChoices, setTabGroupChoices } = useUserPreferencesContext();
  const open = tabGroupChoices[group] ?? defaultOpen;
  const toggle = useCallback(() => {
    setTabGroupChoices(group, open === 'y' ? 'n' : 'y');
  }, [group, open, setTabGroupChoices]);

  return (
    <>
      <div className={styles.debugToggle} onClick={toggle}>
        Store
      </div>
      {open === 'y' ? <StoreTreeM /> : null}
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
