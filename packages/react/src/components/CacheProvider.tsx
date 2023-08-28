import {
  initialState as defaultState,
  NetworkManager,
  Controller,
  applyManager,
  SubscriptionManager,
  PollingSubscription,
  DevToolsManager,
} from '@data-client/core';
import type { State, Manager } from '@data-client/core';
import React, { useMemo, useRef } from 'react';

import CacheStore from './CacheStore.js';
import { ControllerContext } from '../context.js';

/* istanbul ignore next  */
const SSR = typeof window === 'undefined';

interface ProviderProps {
  children: React.ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
  Controller: typeof Controller;
}

/**
 * Manages state, providing all context needed to use the hooks.
 * @see https://dataclient.io/docs/api/CacheProvider
 */
export default function CacheProvider({
  children,
  managers,
  initialState,
  Controller,
}: ProviderProps) {
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production' && SSR) {
    console.warn(
      `CacheProvider does not update while doing SSR.
Try using https://dataclient.io/docs/api/ExternalCacheProvider for server entry points.`,
    );
  }
  // contents of this component expected to be relatively stable
  const controllerRef: React.MutableRefObject<Controller> = useRef<any>();
  if (!controllerRef.current) controllerRef.current = new Controller();
  //TODO: bind all methods so destructuring works

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memodManagers = useMemo(() => managers, managers);

  // Makes manager middleware compatible with redux-style middleware (by a wrapper enhancement to provide controller API)
  const middlewares = useMemo(
    () => applyManager(managers, controllerRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    managers,
  );

  return (
    <ControllerContext.Provider value={controllerRef.current}>
      <CacheStore
        managers={memodManagers}
        middlewares={middlewares}
        initialState={initialState}
        controller={controllerRef.current}
      >
        {children}
      </CacheStore>
    </ControllerContext.Provider>
  );
}
/** Default props for CacheProvider
 * @see https://dataclient.io/docs/api/CacheProvider#defaultprops
 */
CacheProvider.defaultProps = {
  managers: [
    new NetworkManager(),
    new SubscriptionManager(PollingSubscription),
  ] as Manager[],
  initialState: defaultState as State<unknown>,
  Controller,
};

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
  const networkManager: NetworkManager | undefined =
    CacheProvider.defaultProps.managers.find(
      manager => manager instanceof NetworkManager,
    ) as any;
  CacheProvider.defaultProps.managers.unshift(
    new DevToolsManager(
      undefined,
      networkManager && networkManager.skipLogging.bind(networkManager),
    ),
  );
}
