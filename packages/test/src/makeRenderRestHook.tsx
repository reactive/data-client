import { State, Manager } from '@rest-hooks/core';
import { SubscriptionManager } from 'rest-hooks';
import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import mockInitialState, { Fixture } from '@rest-hooks/test/mockState';
import {
  MockNetworkManager,
  MockPollingSubscription,
} from '@rest-hooks/test/managers';

export default function makeRenderRestHook(
  makeProvider: (
    managers: Manager[],
    initialState?: State<unknown>,
  ) => React.ComponentType<{ children: React.ReactChild }>,
) {
  const manager = new MockNetworkManager();
  const subManager = new SubscriptionManager(MockPollingSubscription);
  function renderRestHook<P, R>(
    callback: (props: P) => R,
    options?: {
      initialProps?: P;
      results?: Fixture[];
      wrapper?: React.ComponentType<React.PropsWithChildren<P>>;
    },
  ) {
    const initialState = options?.results && mockInitialState(options.results);
    const Provider: React.ComponentType<any> = makeProvider(
      [manager, subManager],
      initialState,
    );
    const Wrapper = options?.wrapper;
    const wrapper: React.ComponentType<any> = Wrapper
      ? function ProviderWrapped(props: React.PropsWithChildren<P>) {
          return (
            <Provider>
              <Wrapper {...props} />
            </Provider>
          );
        }
      : Provider;
    return renderHook(callback, {
      ...options,
      wrapper,
    });
  }
  /** @deprecated */
  renderRestHook.cleanup = () => {
    console.warn('cleanup() now happened automatically on unmount');
  };
  return renderRestHook;
}
