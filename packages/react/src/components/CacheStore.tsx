// Server Side Component compatibility (specifying this cannot be used as such)
// https://beta.nextjs.org/docs/rendering/server-and-client-components#third-party-packages
'use client';
import type { State, Manager } from '@data-client/core';
import { createReducer, Controller } from '@data-client/core';
import useEnhancedReducer from '@data-client/use-enhanced-reducer';
import type { Middleware } from '@data-client/use-enhanced-reducer';
import React, { useEffect, useMemo, memo } from 'react';

import BackupBoundary from './BackupBoundary.js';
import { StateContext, DispatchContext } from '../context.js';

interface StoreProps {
  children: React.ReactNode;
  managers: Manager[];
  middlewares: Middleware[];
  initialState: State<unknown>;
  controller: Controller;
}
/**
 * This part of the provider concerns only the parts that matter for store changes
 * It expects its props to have referential stability
 */
function CacheStore({
  children,
  managers,
  middlewares,
  initialState,
  controller,
}: StoreProps) {
  const masterReducer = useMemo(() => createReducer(controller), [controller]);

  const [state, dispatch] = useEnhancedReducer(
    masterReducer,
    initialState,
    middlewares,
  );

  const optimisticState = useMemo(
    () => state.optimistic.reduce(masterReducer, state),
    [masterReducer, state],
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
    // we're ignoring state here, because it shouldn't trigger inits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managers]);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={optimisticState}>
        <BackupBoundary>{children}</BackupBoundary>
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}
export default memo(CacheStore);
