import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import {
  State,
  reducer,
  ExternalCacheProvider,
  CacheProvider,
  Manager,
} from '..';

// Extension of the DeepPartial type defined by Redux which handles unknown
type DeepPartialWithUnknown<T> = {
  [K in keyof T]?: T[K] extends unknown
    ? any
    : (T[K] extends object ? DeepPartialWithUnknown<T[K]> : T[K]);
};

const makeExternalCacheProvider = (
  managers: Manager[],
  initialState?: DeepPartialWithUnknown<State<any>>,
) => {
  const store = createStore(
    reducer,
    initialState,
    applyMiddleware(...managers.map(manager => manager.getMiddleware())),
  );

  return function ConfiguredExternalCacheProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <ExternalCacheProvider store={store} selector={s => s}>
        {children}
      </ExternalCacheProvider>
    );
  };
};

const makeCacheProvider = (
  managers: Manager[],
  initialState?: State<unknown>,
) => {
  return function ConfiguredCacheProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <CacheProvider managers={managers} initialState={initialState}>
        {children}
      </CacheProvider>
    );
  };
};

export { makeExternalCacheProvider, makeCacheProvider };
