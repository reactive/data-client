import { DataProvider, type Manager, type State } from '@data-client/react';
import { MockResolver } from '@data-client/test/browser';
import React, {
  memo,
  useState,
  lazy,
  type ProfilerOnRenderCallback,
} from 'react';

import { MotionGroup } from '../../motion';
import Boundary from '../Boundary';
import type ManagerHost from './managers';
import { ManagerError, ManagersSync } from './ManagersSync';
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
  managerHost,
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
    /** Managers the code declares with `getManagers()` */
    managerHost: ManagerHost;
    /** User pointer/keyboard input inside the result */
    onInteract: () => void;
  }) {
  // DataProvider keeps its first managers, so build them once per mount
  // (create() runs the code's getManagers() and clears the last error)
  const [managers] = useState<Manager[]>(() => {
    const { managers, network } = managerHost.create();
    const log = registry.log.connect(history, replacedHistory, action =>
      network.skipLogging(action),
    );
    return [log.head, registry, ...managers, log.tail];
  });

  return (
    // devButton: getDefaultManagers() includes DevToolsManager in development
    <DataProvider
      managers={managers}
      initialState={initialState}
      devButton={null}
    >
      <MockResolver
        fixtures={fixtures}
        silenceMissing={true}
        getInitialInterceptorData={getInitialInterceptorData}
      >
        <ManagersSync host={managerHost} />
        <MotionGroup layoutDependency={storeOpen}>
          <div
            className={`playground-preview ${styles.playgroundPreview}`}
            onPointerDownCapture={onInteract}
            onKeyDownCapture={onInteract}
          >
            <Boundary fallback={null}>
              <PreviewBlockLazy onCommit={onCommit} {...errorProps} />
            </Boundary>
            <ManagerError host={managerHost} />
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
