import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import reducer from '../state/reducer';
import NetworkManager from '../state/NetworkManager';
import SubscriptionManager from '../state/SubscriptionManager';
import ExternalCacheProvider from '../react-integration/provider/ExternalCacheProvider';
import RestProvider from '../react-integration/provider/RestProvider';
import { ReactNode } from 'react';

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
