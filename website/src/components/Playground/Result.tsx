import { CacheProvider } from 'rest-hooks';
import React, { memo, useCallback, useState, Suspense } from 'react';
import useUserPreferencesContext from '@theme/hooks/useUserPreferencesContext';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { LiveError, LivePreview } from 'react-live';
import clsx from 'clsx';

import styles from './styles.module.css';
import StoreInspector from './StoreInspector';

function Result({
  groupId,
  defaultOpen,
  row,
}: {
  groupId: string;
  row: boolean;
  defaultOpen: 'y' | 'n';
}) {
  const isBrowser = useIsBrowser();
  const { tabGroupChoices, setTabGroupChoices } = useUserPreferencesContext();
  const [selectedValue, setSelectedValue] = useState(defaultOpen);

  if (groupId != null) {
    const choice = tabGroupChoices[groupId];
    if (choice != null && choice !== selectedValue) {
      setSelectedValue(choice as any);
    }
  }

  const toggle = useCallback(() => {
    setSelectedValue(open => (open === 'y' ? 'n' : 'y'));
    setTabGroupChoices(groupId, selectedValue === 'y' ? 'n' : 'y');
  }, [groupId, selectedValue, setTabGroupChoices]);

  const child = isBrowser ? (
    <Suspense fallback="loading...">
      <LivePreview />
      <LiveError />
    </Suspense>
  ) : null;

  const hiddenResult = !(selectedValue === 'n' || !row);

  return (
    <CacheProvider>
      <div
        className={clsx(styles.playgroundPreview, {
          [styles.hidden]: hiddenResult,
        })}
      >
        {child}
      </div>
      <StoreInspector selectedValue={selectedValue} toggle={toggle} />
    </CacheProvider>
  );
}
export default memo(Result);
