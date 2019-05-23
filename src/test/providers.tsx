import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import { ReactNode } from 'react';
import {
  State,
  reducer,
  NetworkManager,
  SubscriptionManager,
  ExternalCacheProvider,
  RestProvider,
} from '../index';

// Extension of the DeepPartial type defined by Redux which handles unknown
type DeepPartialWithUnknown<T> = {
  [K in keyof T]?: T[K] extends unknown
    ? any
    : (T[K] extends object ? DeepPartialWithUnknown<T[K]> : T[K])
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

  return ({ children }: { children: ReactNode }) => (
    <ExternalCacheProvider store={store} selector={s => s}>
      {children}
    </ExternalCacheProvider>
  );
};

const makeRestProvider = (
  manager: NetworkManager,
  subscriptionManager: SubscriptionManager<any>,
  initialState?: State<unknown>,
) => {
  return ({ children }: { children: ReactNode }) => (
    <RestProvider
      manager={manager}
      subscriptionManager={subscriptionManager}
      initialState={initialState}
    >
      {children}
    </RestProvider>
  );
};

export { makeExternalCacheProvider, makeRestProvider };
