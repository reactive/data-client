import { initialState as defaultState } from '@rest-hooks/core/state/reducer';
import NetworkManager from '@rest-hooks/core/state/NetworkManager';
import { State, Manager } from '@rest-hooks/core/types';
import React, { ReactNode, useMemo } from 'react';
import { useRef } from 'react';
import {
  DenormalizeCacheContext,
  ControllerContext,
} from '@rest-hooks/core/react-integration/context';
import Controller from '@rest-hooks/core/controller/Controller';
import applyManager from '@rest-hooks/core/state/applyManager';
import CacheStore from '@rest-hooks/core/react-integration/provider/CacheStore';

interface ProviderProps {
  children: ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
}

/**
 * Controller managing state of the REST cache and coordinating network requests.
 * @see https://resthooks.io/docs/api/CacheProvider
 */
export default function CacheProvider({
  children,
  managers,
  initialState,
}: ProviderProps) {
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
        >
          {children}
        </CacheStore>{' '}
      </DenormalizeCacheContext.Provider>
    </ControllerContext.Provider>
  );
}
CacheProvider.defaultProps = {
  managers: [new NetworkManager()] as Manager[],
  initialState: defaultState as State<unknown>,
};
