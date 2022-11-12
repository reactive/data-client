import { State, Manager, Controller, __INTERNAL__ } from '@rest-hooks/react';
import React, { useEffect } from 'react';
import { createStore, applyMiddleware, combineReducers } from 'redux';

import { default as CacheProvider } from './ExternalCacheProvider.js';
import { default as mapMiddleware } from './mapMiddleware.js';
import { default as PromiseifyMiddleware } from './PromiseifyMiddleware.js';

const {
  createReducer,
  applyManager,
  initialState: defaultState,
} = __INTERNAL__;

// Extension of the DeepPartial type defined by Redux which handles unknown
type DeepPartialWithUnknown<T> = {
  [K in keyof T]?: T[K] extends unknown
    ? any
    : T[K] extends object
    ? DeepPartialWithUnknown<T[K]>
    : T[K];
};

const makeExternalCacheProvider = function makeExternal(
  managers: Manager[],
  initialState: DeepPartialWithUnknown<State<any>> = defaultState,
) {
  const selector = (s: { restHooks: State<unknown> }) => s.restHooks;
  const controller = new Controller();
  const reducer = createReducer(controller);
  const store = createStore(
    combineReducers({ restHooks: reducer }),
    { restHooks: initialState as any },
    applyMiddleware(
      ...mapMiddleware(selector)(...applyManager(managers, controller)),
      PromiseifyMiddleware,
    ),
  );

  return function ConfiguredExternalCacheProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    // this is not handled in ExternalCacheProvider as it doesn't
    // own its managers. Since we are owning them here, we should ensure it happens
    useEffect(() => {
      for (let i = 0; i < managers.length; ++i) {
        managers[i].init?.(selector(store.getState()));
      }
      return () => {
        for (let i = 0; i < managers.length; ++i) {
          managers[i].cleanup();
        }
      };
    }, []);

    return (
      <CacheProvider store={store} selector={selector} controller={controller}>
        {children}
      </CacheProvider>
    );
  };
};
export default makeExternalCacheProvider;
