import React, { useMemo } from 'react';
import { useRef } from 'react';

import { initialState as defaultState } from '../../state/createReducer.js';
import NetworkManager from '../../state/NetworkManager.js';
import { State, Manager } from '../../types.js';
import { DenormalizeCacheContext, ControllerContext } from '../context.js';
import applyManager from '../../state/applyManager.js';
import CacheStore from './CacheStore.js';
import Controller from '../../controller/Controller.js';

/* istanbul ignore next  */
const SSR = typeof window === 'undefined';

interface ProviderProps {
  children: React.ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
  Controller: typeof Controller;
}

/**
 * Controller managing state of the cache and coordinating network requests.
 * @see https://resthooks.io/docs/api/CacheProvider
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
Try using https://resthooks.io/docs/api/ExternalCacheProvider for server entry points.`,
    );
  }
  // contents of this component expected to be relatively stable

  const controllerRef: React.MutableRefObject<Controller> = useRef<any>();
  if (!controllerRef.current) controllerRef.current = new Controller();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memodManagers = useMemo(() => managers, managers);

  const middlewares = useMemo(
    () => applyManager(managers, controllerRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    managers,
  );

  return (
    <ControllerContext.Provider value={controllerRef.current}>
      <DenormalizeCacheContext.Provider
        value={controllerRef.current.globalCache}
      >
        <CacheStore
          managers={memodManagers}
          middlewares={middlewares}
          initialState={initialState}
          controller={controllerRef.current}
        >
          {children}
        </CacheStore>
      </DenormalizeCacheContext.Provider>
    </ControllerContext.Provider>
  );
}
CacheProvider.defaultProps = {
  managers: [new NetworkManager()] as Manager[],
  initialState: defaultState as State<unknown>,
  Controller,
};
