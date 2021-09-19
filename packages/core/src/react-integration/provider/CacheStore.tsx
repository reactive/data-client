import masterReducer from '@rest-hooks/core/state/reducer';
import { State, Manager } from '@rest-hooks/core/types';
import useEnhancedReducer from '@rest-hooks/use-enhanced-reducer';
import React, { ReactNode, useEffect, useMemo, memo } from 'react';
import {
  StateContext,
  DispatchContext,
} from '@rest-hooks/core/react-integration/context';
import BackupBoundary from '@rest-hooks/core/react-integration/provider/BackupBoundary';
import type { Middleware } from '@rest-hooks/use-enhanced-reducer';

interface StoreProps {
  children: ReactNode;
  managers: Manager[];
  middlewares: Middleware[];
  initialState: State<unknown>;
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
}: StoreProps) {
  const [state, dispatch] = useEnhancedReducer(
    masterReducer,
    initialState,
    middlewares,
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
