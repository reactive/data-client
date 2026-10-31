// Server Side Component compatibility (specifying this cannot be used as such)
// https://beta.nextjs.org/docs/rendering/server-and-client-components#third-party-packages
'use client';
import type { State, Manager } from '@data-client/core';
import { createReducer, Controller } from '@data-client/core';
import useEnhancedReducer from '@data-client/use-enhanced-reducer';
import type { Middleware as GenericMiddleware } from '@data-client/use-enhanced-reducer';
import React, { useEffect, useMemo, memo } from 'react';

import BackupLoading from './BackupLoading.js';
import type ClientStore from './ClientStore.js';
import UniversalSuspense from './UniversalSuspense.js';
import { StateContext } from '../context.js';

interface StoreProps {
  children: React.ReactNode;
  mgrEffect: () => void;
  middlewares: GenericMiddleware[];
  initialState: State<unknown>;
  controller: Controller;
  store?: ClientStore;
}
/**
 * This part of the provider concerns only the parts that matter for store changes
 * It expects its props to have referential stability
 */
function DataStore({
  children,
  mgrEffect,
  middlewares,
  initialState,
  controller,
  store,
}: StoreProps) {
  const masterReducer = useMemo(
    () => store?.reducer ?? createReducer(controller),
    [store, controller],
  );

  // we don't need `dispatch` here, since applyManager() assigns the dispatch to controller
  // a provider keeps or lacks its store for its whole life, so the hooks stay the same
  const state =
    store ?
      store.useState()
      // eslint-disable-next-line react-hooks/rules-of-hooks
    : useEnhancedReducer(masterReducer, initialState, middlewares)[0];

  const optimisticState = useMemo(
    () => state.optimistic.reduce(masterReducer, state),
    [masterReducer, state],
  );

  // only run once everything is prepared
  useEffect(mgrEffect, [mgrEffect]);

  return (
    <StateContext.Provider value={optimisticState}>
      <UniversalSuspense fallback={<BackupLoading />}>
        {children}
      </UniversalSuspense>
    </StateContext.Provider>
  );
}
export default memo(DataStore);
