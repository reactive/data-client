import { State, Manager, Controller, __INTERNAL__ } from '@rest-hooks/react';
import React, { useEffect } from 'react';

import { default as CacheProvider } from './ExternalCacheProvider.js';
import { prepareStore } from './prepareStore.js';

const {
  createReducer,
  applyManager,
  initialState: defaultState,
} = __INTERNAL__;

// Extension of the DeepPartial type defined by Redux which handles unknown
export type DeepPartialWithUnknown<T> = {
  [K in keyof T]?: T[K] extends unknown
    ? any
    : T[K] extends object
    ? DeepPartialWithUnknown<T[K]>
    : T[K];
};

const makeExternalCacheProvider = function makeExternal(
  managers: Manager[],
  initialState: DeepPartialWithUnknown<State<any>> = defaultState,
  Ctrl: typeof Controller,
) {
  const { selector, store, controller } = prepareStore(
    initialState,
    managers,
    Ctrl,
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
