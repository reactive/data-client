import React, { Suspense } from 'react';
import { renderHook } from 'react-hooks-testing-library';

import { MockNetworkManager } from './managers';
import {
  State,
  NetworkManager,
  SubscriptionManager,
  PollingSubscription,
} from '../index';

export default function createRenderRestHook(
  makeProvider: (
    manager: NetworkManager,
    subManager: SubscriptionManager<any>,
    initialState?: State<unknown>,
  ) => React.ComponentType<{ children: React.ReactChild }>,
) {
  const manager = new MockNetworkManager();
  const subManager = new SubscriptionManager(PollingSubscription);
  function renderRestHook<T>(callback: () => T, initialState?: State<unknown>) {
    const Provider = makeProvider(manager, subManager, initialState);
    return renderHook(callback, {
      wrapper: ({ children }) => (
        <Provider>
          <Suspense fallback={() => null}>{children}</Suspense>
        </Provider>
      ),
    });
  }
  renderRestHook.cleanup = () => {
    manager.cleanup();
    subManager.cleanup();
  };
  return renderRestHook;
}
