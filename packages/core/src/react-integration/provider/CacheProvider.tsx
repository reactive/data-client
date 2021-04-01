import masterReducer, {
  initialState as defaultState,
} from '@rest-hooks/core/state/reducer';
import NetworkManager from '@rest-hooks/core/state/NetworkManager';
import { State, Manager } from '@rest-hooks/core/types';
import useEnhancedReducer from '@rest-hooks/use-enhanced-reducer';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { useRef } from 'react';

import {
  StateContext,
  DispatchContext,
  DenormalizeCacheContext,
} from '../context';

interface ProviderProps {
  children: ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
}

/** Controller managing state of the REST cache and coordinating network requests. */
export default function CacheProvider({
  children,
  managers,
  initialState,
}: ProviderProps) {
  const denormalizeCache = useRef({
    entities: {},
    results: {},
  });
  const [state, dispatch] = useEnhancedReducer(
    masterReducer,
    initialState,
    managers.map(manager => manager.getMiddleware()),
  );

  const optimisticState = useMemo(
    () => state.optimistic.reduce(masterReducer, state),
    [state],
  );

  // if we change out the manager we need to make sure it has no hanging async
  useEffect(() => {
    for (let i = 0; i < managers.length; ++i) {
      managers[i].init?.(state);
    }
    return () => {
      for (let i = 0; i < managers.length; ++i) {
        managers[i].cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, managers);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={optimisticState}>
        <DenormalizeCacheContext.Provider value={denormalizeCache.current}>
          {children}
        </DenormalizeCacheContext.Provider>
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}
CacheProvider.defaultProps = {
  managers: [new NetworkManager()] as Manager[],
  initialState: defaultState as State<unknown>,
};
