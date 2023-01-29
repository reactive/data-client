import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import {
  type Fixture,
  type Interceptor,
  MockResolver,
} from '@rest-hooks/test/browser';
import clsx from 'clsx';
import React, { memo, useCallback, useState, useMemo, lazy } from 'react';
import {
  CacheProvider,
  PollingSubscription,
  SubscriptionManager,
  NetworkManager,
} from 'rest-hooks';

import Boundary from './Boundary';
import StoreInspector from './StoreInspector';
import styles from './styles.module.css';
import { useTabStorage } from '../../utils/tabStorage';

function Preview({
  groupId,
  defaultOpen,
  row,
  fixtures,
}: {
  groupId: string;
  row: boolean;
  defaultOpen: 'y' | 'n';
  fixtures: (Fixture | Interceptor)[];
}) {
  const [choice, setTabGroupChoice] = useTabStorage(
    `docusaurus.tab.${groupId}`,
  );
  const [selectedValue, setSelectedValue] = useState(defaultOpen);
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();

  if (choice != null && choice !== selectedValue) {
    setSelectedValue(choice as any);
  }

  const toggle = useCallback(
    (
      event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>,
    ) => {
      blockElementScrollPositionUntilNextRender(event.currentTarget);
      setSelectedValue(open => (open === 'y' ? 'n' : 'y'));
      setTabGroupChoice(selectedValue === 'y' ? 'n' : 'y');
    },
    [
      blockElementScrollPositionUntilNextRender,
      selectedValue,
      setTabGroupChoice,
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
