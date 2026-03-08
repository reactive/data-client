import {
  DataProvider,
  PollingSubscription,
  SubscriptionManager,
  NetworkManager,
} from '@data-client/react';
import { MockResolver } from '@data-client/test/browser';
import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import clsx from 'clsx';
import React, { memo, useCallback, useMemo, lazy } from 'react';

import Boundary from './Boundary';
import StoreInspector from './StoreInspector';
import styles from './styles.module.css';
import type { PreviewProps } from './types';
import { useTabStorage } from '../../utils/tabStorage';

function Preview<T>({
  groupId,
  defaultOpen,
  row,
  fixtures,
  getInitialInterceptorData,
}: PreviewProps<T>) {
  const [choice, setTabGroupChoice] = useTabStorage(
    `docusaurus.tab.${groupId}`,
  );
  const selectedValue = (choice ?? defaultOpen) as 'y' | 'n';
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();

  const toggle = useCallback(
    (
      event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>,
    ) => {
      blockElementScrollPositionUntilNextRender(event.currentTarget);
      const next = selectedValue === 'y' ? 'n' : 'y';
      setTabGroupChoice(next);
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
    <DataProvider managers={managers}>
      <MockResolver
        fixtures={fixtures}
        silenceMissing={true}
        getInitialInterceptorData={getInitialInterceptorData}
      >
        <div
          className={clsx('playground-preview', styles.playgroundPreview, {
            [styles.hidden]: hiddenResult,
          })}
        >
          <Boundary fallback={null}>
            <PreviewBlockLazy />
          </Boundary>
        </div>
        <StoreInspector selectedValue={selectedValue} toggle={toggle} />
      </MockResolver>
    </DataProvider>
  );
}
export default memo(Preview);

const PreviewBlockLazy = lazy(
  () =>
    import(
      /* webpackChunkName: 'PreviewBlock', webpackPreload: true */ './PreviewBlock'
    ),
);
