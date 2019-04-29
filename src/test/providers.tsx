import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import { ReactNode } from 'react';
import {
  reducer,
  NetworkManager,
  SubscriptionManager,
  ExternalCacheProvider,
  RestProvider,
} from '../index';

const makeExternalCacheProvider = (
  manager: NetworkManager,
  subscriptionManager: SubscriptionManager<any>,
) => {
  const store = createStore(
    reducer,
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
) => {
  return ({ children }: { children: ReactNode }) => (
    <RestProvider manager={manager} subscriptionManager={subscriptionManager}>
      {children}
    </RestProvider>
  );
};

export { makeExternalCacheProvider, makeRestProvider };
