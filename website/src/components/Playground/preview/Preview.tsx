import {
  DataProvider,
  PollingSubscription,
  SubscriptionManager,
  NetworkManager,
  type Manager,
  type State,
} from '@data-client/react';
import { MockResolver } from '@data-client/test/browser';
import React, {
  memo,
  useMemo,
  lazy,
  type ProfilerOnRenderCallback,
} from 'react';

import { MotionGroup } from '../../motion';
import Boundary from '../Boundary';
import type { PreviewErrorProps } from './PreviewError';
import SchemaRegistry from './store/schemaRegistry';
import StoreInspector from './StoreInspector';
import styles from '../styles.module.css';
import type { PreviewProps } from '../types';

function Preview<T>({
  storeOpen,
  toggleStore,
  row,
  storeHost,
  fixtures,
  getInitialInterceptorData,
  onCommit,
  initialState,
  registry,
  history,
  replacedHistory,
  onInteract,
  ...errorProps
}: PreviewProps<T> &
  PreviewErrorProps & {
    /** Called on every React commit of the live result (enables a `<Profiler>`) */
    onCommit?: ProfilerOnRenderCallback;
    initialState?: State<unknown>;
    /** Schemas the Store inspector has seen */
    registry: SchemaRegistry;
    /** Where this store's actions go in `registry.log` */
    history: number;
    /** A history that may still come back; the log drops any other */
    replacedHistory?: number;
    /** User pointer/keyboard input inside the result */
    onInteract: () => void;
  }) {
  const managers = useMemo<Manager[]>(() => {
    const network = new NetworkManager();
    const log = registry.log.connect(history, replacedHistory, action =>
      network.skipLogging(action),
    );
    return [
      log.head,
      registry,
      network,
      new SubscriptionManager(PollingSubscription),
      log.tail,
    ];
  }, [registry, history, replacedHistory]);

  return (
    <DataProvider managers={managers} initialState={initialState}>
      <MockResolver
        fixtures={fixtures}
        silenceMissing={true}
        getInitialInterceptorData={getInitialInterceptorData}
      >
        <MotionGroup layoutDependency={storeOpen}>
          <div
            className={`playground-preview ${styles.playgroundPreview}`}
            onPointerDownCapture={onInteract}
            onKeyDownCapture={onInteract}
          >
            <Boundary fallback={null}>
              <PreviewBlockLazy onCommit={onCommit} {...errorProps} />
            </Boundary>
          </div>
          <StoreInspector
            open={storeOpen}
            toggle={toggleStore}
            registry={registry}
            history={history}
            row={row}
            host={storeHost}
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
