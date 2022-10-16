import {
  CacheProvider,
  PollingSubscription,
  SubscriptionManager,
} from 'rest-hooks';
import { NetworkManager } from '@rest-hooks/core';
import { FixtureEndpoint, MockResolver } from '@rest-hooks/test';
import React, { memo, useCallback, useState, useMemo, lazy } from 'react';
import clsx from 'clsx';
import {
  useScrollPositionBlocker,
  useTabGroupChoice,
} from '@docusaurus/theme-common/internal';

import styles from './styles.module.css';
import StoreInspector from './StoreInspector';
import Boundary from './Boundary';

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
          <Boundary fallback={<LivePreviewLoader />}>
            <PreviewBlockLazy />
          </Boundary>
        </div>
        <StoreInspector selectedValue={selectedValue} toggle={toggle} />
      </MockResolver>
    </CacheProvider>
  );
}
export default memo(Preview);

function LivePreviewLoader() {
  return <div>Loading...</div>;
}
const PreviewBlockLazy = lazy(
  () =>
    import(
      /* webpackChunkName: '[request]', webpackPreload: true */ './PreviewBlock'
    ),
);
