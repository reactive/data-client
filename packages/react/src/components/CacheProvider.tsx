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
import type { DevToolsPosition } from './DevToolsButton.js';
import { SSR } from './LegacyReact.js';
import { renderDevButton } from './renderDevButton.js';
import { ControllerContext } from '../context.js';

export interface ProviderProps {
  children: React.ReactNode;
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: typeof Controller;
  devButton?: DevToolsPosition | null | undefined;
}

interface Props {
  children: React.ReactNode;
  managers?: Manager[];
  initialState: State<unknown>;
  Controller: typeof Controller;
  devButton: DevToolsPosition | null | undefined;
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
  devButton,
}: Props): JSX.Element {
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

  const managersRef: React.MutableRefObject<Manager[]> = useRef<any>(managers);
  if (!managersRef.current) managersRef.current = getDefaultManagers();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memodManagers = useMemo(() => managersRef.current, managersRef.current);

  // Makes manager middleware compatible with redux-style middleware (by a wrapper enhancement to provide controller API)
  const middlewares = useMemo(
    () => applyManager(managersRef.current, controllerRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    managersRef.current,
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
      {renderDevButton(devButton)}
    </ControllerContext.Provider>
  );
}
/** Default props for CacheProvider
 * @see https://dataclient.io/docs/api/CacheProvider#defaultprops
 */
CacheProvider.defaultProps = {
  initialState: defaultState as State<unknown>,
  Controller,
  devButton: 'bottom-right',
};

/* istanbul ignore next */
let getDefaultManagers = () =>
  [
    new NetworkManager(),
    new SubscriptionManager(PollingSubscription),
  ] as Manager[];

/* istanbul ignore else */
if (process.env.NODE_ENV !== 'production') {
  getDefaultManagers = () => {
    const networkManager = new NetworkManager();
    return [
      new DevToolsManager(
        undefined,
        networkManager.skipLogging.bind(networkManager),
      ),
      networkManager,
      new SubscriptionManager(PollingSubscription),
    ] as Manager[];
  };
}
export { getDefaultManagers };
