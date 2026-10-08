import {
  DataProvider,
  PollingSubscription,
  SubscriptionManager,
  NetworkManager,
  type Manager,
  type State,
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
import type { PreviewErrorProps } from './PreviewError';
import SchemaRegistry from './store/schemaRegistry';
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
  initialState,
  registry,
  onInteract,
  ...errorProps
}: PreviewProps<T> &
  PreviewErrorProps & {
    /** Called on every React commit of the live result (enables a `<Profiler>`) */
    onCommit?: ProfilerOnRenderCallback;
    initialState?: State<unknown>;
    /** Schemas the Store inspector has seen */
    registry: SchemaRegistry;
    /** User pointer/keyboard input inside the result */
    onInteract: () => void;
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

  const managers = useMemo<Manager[]>(() => {
    // this mount is a new store: drop the last one's pending optimistic
    // updates before the Store panel first renders (DataStore's init()
    // only runs after it)
    registry.init();
    return [
      registry,
      new NetworkManager(),
      new SubscriptionManager(PollingSubscription),
    ];
  }, [registry]);

  const coveredResult = row && selectedValue === 'y';
  return (
    <DataProvider managers={managers} initialState={initialState}>
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
            onPointerDownCapture={onInteract}
            onKeyDownCapture={onInteract}
          >
            <Boundary fallback={null}>
              <PreviewBlockLazy onCommit={onCommit} {...errorProps} />
            </Boundary>
          </div>
          <StoreInspector
            selectedValue={selectedValue}
            toggle={toggle}
            registry={registry}
          />
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
