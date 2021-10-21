import {
  CacheProvider,
  PollingSubscription,
  SubscriptionManager,
} from 'rest-hooks';
import { NetworkManager } from '@rest-hooks/core';
import React, { memo, useCallback, useState, Suspense, useMemo } from 'react';
import useUserPreferencesContext from '@theme/hooks/useUserPreferencesContext';
import { LiveError, LivePreview } from 'react-live';
import clsx from 'clsx';
import { useScrollPositionBlocker } from '@docusaurus/theme-common';
import BrowserOnly from '@docusaurus/BrowserOnly';

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
  const { tabGroupChoices, setTabGroupChoices } = useUserPreferencesContext();
  const [selectedValue, setSelectedValue] = useState(defaultOpen);
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();

  if (groupId != null) {
    const choice = tabGroupChoices[groupId];
    if (choice != null && choice !== selectedValue) {
      setSelectedValue(choice as any);
    }
  }

  const toggle = useCallback(
    (
      event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>,
    ) => {
      blockElementScrollPositionUntilNextRender(event.currentTarget);
      setSelectedValue(open => (open === 'y' ? 'n' : 'y'));
      setTabGroupChoices(groupId, selectedValue === 'y' ? 'n' : 'y');
    },
    [
      blockElementScrollPositionUntilNextRender,
      groupId,
      selectedValue,
      setTabGroupChoices,
    ],
  );

  const managers = useMemo(
    () => [new NetworkManager(), new SubscriptionManager(PollingSubscription)],
    [],
  );

  const hiddenResult = !(selectedValue === 'n' || !row);

  return (
    <CacheProvider managers={managers}>
      <div
        className={clsx(styles.playgroundPreview, {
          [styles.hidden]: hiddenResult,
        })}
      >
        <BrowserOnly fallback={<LivePreviewLoader />}>
          {() => (
            <Suspense fallback={<LivePreviewLoader />}>
              <LivePreview />
              <LiveError />
            </Suspense>
          )}
        </BrowserOnly>
      </div>
      <StoreInspector selectedValue={selectedValue} toggle={toggle} />
    </CacheProvider>
  );
}
export default memo(Result);

function LivePreviewLoader() {
  return <div>Loading...</div>;
}
