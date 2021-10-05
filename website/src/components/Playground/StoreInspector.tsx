import { StateContext } from '@rest-hooks/core';
import React, { useContext, memo, useCallback, useMemo, useState } from 'react';
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
  const { tabGroupChoices, setTabGroupChoices } = useUserPreferencesContext();
  const [selectedValue, setSelectedValue] = useState(defaultOpen);

  if (groupId != null) {
    const choice = tabGroupChoices[groupId];
    if (choice != null && choice !== selectedValue) {
      setSelectedValue(choice);
    }
  }

  const toggle = useCallback(() => {
    setSelectedValue(open => (open === 'y' ? 'n' : 'y'));
    setTabGroupChoices(groupId, selectedValue === 'y' ? 'n' : 'y');
  }, [groupId, selectedValue, setTabGroupChoices]);

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
