import React, { Suspense } from 'react';
import { renderHook } from 'react-hooks-testing-library';

import { MockNetworkManager } from './managers';
import NetworkManager from '../state/NetworkManager';
import SubscriptionManager from '../state/SubscriptionManager';
import PollingSubscription from '../state/PollingSubscription';

export default function createRenderRestHook(
  makeProvider: (
    manager: NetworkManager,
    subManager: SubscriptionManager<any>,
  ) => React.ComponentType<{ children: React.ReactChild }>,
) {
  const manager = new MockNetworkManager();
  const subManager = new SubscriptionManager(PollingSubscription);
  const Provider = makeProvider(manager, subManager);

  function renderRestHook<T>(callback: () => T) {
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
