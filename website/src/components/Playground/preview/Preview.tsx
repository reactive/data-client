import {
  DataProvider,
  PollingSubscription,
  SubscriptionManager,
  NetworkManager,
} from '@data-client/react';
import { MockResolver } from '@data-client/test/browser';
import { useScrollPositionBlocker } from '@docusaurus/theme-common/internal';
import clsx from 'clsx';
import React, {
  memo,
  useCallback,
  useMemo,
  lazy,
  type ProfilerOnRenderCallback,
} from 'react';

import { MotionGroup } from '../../motion';
import Boundary from '../Boundary';
import StoreInspector from './StoreInspector';
import { useTabStorage } from '../../../utils/tabStorage';
import styles from '../styles.module.css';
import type { PreviewProps } from '../types';

function Preview<T>({
  groupId,
  defaultOpen,
  row,
  fixtures,
  getInitialInterceptorData,
  onCommit,
}: PreviewProps<T> & {
  /** Called on every React commit of the live result (enables a `<Profiler>`) */
  onCommit?: ProfilerOnRenderCallback;
}) {
  const [choice, setTabGroupChoice] = useTabStorage(groupId);
  const selectedValue = choice === 'y' || choice === 'n' ? choice : defaultOpen;
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();

  const toggle = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
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

  const coveredResult = row && selectedValue === 'y';
  return (
    <DataProvider managers={managers}>
      <MockResolver
        fixtures={fixtures}
        silenceMissing={true}
        getInitialInterceptorData={getInitialInterceptorData}
      >
        <MotionGroup layoutDependency={selectedValue}>
          <div
            className={clsx('playground-preview', styles.playgroundPreview, {
              [styles.covered]: coveredResult,
            })}
            inert={coveredResult}
          >
            <Boundary fallback={null}>
              <PreviewBlockLazy onCommit={onCommit} />
            </Boundary>
          </div>
          <StoreInspector selectedValue={selectedValue} toggle={toggle} />
        </MotionGroup>
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
