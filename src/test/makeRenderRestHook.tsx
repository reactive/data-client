import React from 'react';
import { renderHook, RenderHookOptions } from '@testing-library/react-hooks';

import { MockNetworkManager } from './managers';
import mockInitialState, { Fixture } from './mockState';
import { State, SubscriptionManager, PollingSubscription, Manager } from '..';

export default function makeRenderRestHook(
  makeProvider: (
    managers: Manager[],
    initialState?: State<unknown>,
  ) => React.ComponentType<{ children: React.ReactChild }>,
) {
  const manager = new MockNetworkManager();
  const subManager = new SubscriptionManager(PollingSubscription);
  function renderRestHook<P, R>(
    callback: (props: P) => R,
    options?: {
      initialProps?: P;
      results?: Fixture[];
    } & RenderHookOptions<P>,
  ) {
    const initialState =
      options && options.results && mockInitialState(options.results);
    const Provider: React.ComponentType<any> = makeProvider(
      [manager, subManager],
      initialState,
    );
    const Wrapper = options && options.wrapper;
    const wrapper: React.ComponentType<any> = Wrapper
      ? function ProviderWrapped({ children }: { children: React.ReactChild }) {
          return (
            <Provider>
              <Wrapper>{children}</Wrapper>
            </Provider>
          );
        }
      : Provider;
    return renderHook(callback, {
      ...options,
      wrapper,
    });
  }
  renderRestHook.cleanup = () => {
    manager.cleanup();
    subManager.cleanup();
  };
  return renderRestHook;
}
