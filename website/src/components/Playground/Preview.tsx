import {
  CacheProvider,
  PollingSubscription,
  SubscriptionManager,
} from 'rest-hooks';
import { NetworkManager } from '@rest-hooks/core';
import { FixtureEndpoint, MockResolver } from '@rest-hooks/test';
import React, { memo, useCallback, useState, Suspense, useMemo } from 'react';
import { LiveError, LivePreview } from 'react-live';
import clsx from 'clsx';
import {
  useScrollPositionBlocker,
  useTabGroupChoice,
} from '@docusaurus/theme-common/internal';
import BrowserOnly from '@docusaurus/BrowserOnly';

import styles from './styles.module.css';
import StoreInspector from './StoreInspector';

function Preview({
  groupId,
  defaultOpen,
  row,
  fixtures,
}: {
  groupId: string;
  row: boolean;
  defaultOpen: 'y' | 'n';
  fixtures: FixtureEndpoint[];
}) {
  const { tabGroupChoices, setTabGroupChoices } = useTabGroupChoice();
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
      <MockResolver fixtures={fixtures} silenceMissing={true}>
        <div
          className={clsx(styles.playgroundPreview, {
            [styles.hidden]: hiddenResult,
          })}
        >
          <BrowserOnly fallback={<LivePreviewLoader />}>
            {() => (
              <Suspense fallback={<LivePreviewLoader />}>
                <LivePreview />
                <LiveError className={styles.playgroundError} />
              </Suspense>
            )}
          </BrowserOnly>
        </div>
        <BrowserOnly fallback={<LivePreviewLoader />}>
          {() => (
            <StoreInspector selectedValue={selectedValue} toggle={toggle} />
          )}
        </BrowserOnly>
      </MockResolver>
    </CacheProvider>
  );
}
export default memo(Preview);

function LivePreviewLoader() {
  return <div>Loading...</div>;
}
