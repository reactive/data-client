import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import { ReactNode } from 'react';
import {
  State,
  reducer,
  NetworkManager,
  SubscriptionManager,
  ExternalCacheProvider,
  CacheProvider,
} from '..';

// Extension of the DeepPartial type defined by Redux which handles unknown
type DeepPartialWithUnknown<T> = {
  [K in keyof T]?: T[K] extends unknown
    ? any
    : (T[K] extends object ? DeepPartialWithUnknown<T[K]> : T[K]);
};

const makeExternalCacheProvider = (
  manager: NetworkManager,
  subscriptionManager: SubscriptionManager<any>,
  initialState?: DeepPartialWithUnknown<State<any>>,
) => {
  const store = createStore(
    reducer,
    initialState,
    applyMiddleware(
      manager.getMiddleware(),
      subscriptionManager.getMiddleware(),
    ),
  );

  return function ConfiguredExternalCacheProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    return (
      <ExternalCacheProvider store={store} selector={s => s}>
        {children}
      </ExternalCacheProvider>
    );
  };
};

const makeCacheProvider = (
  manager: NetworkManager,
  subscriptionManager: SubscriptionManager<any>,
  initialState?: State<unknown>,
) => {
  return function ConfiguredCacheProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    return (
      <CacheProvider
        manager={manager}
        subscriptionManager={subscriptionManager}
        initialState={initialState}
      >
        {children}
      </CacheProvider>
    );
  };
};

export { makeExternalCacheProvider, makeCacheProvider };
