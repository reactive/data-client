import { State, Manager } from '@rest-hooks/core';
import { SubscriptionManager } from 'rest-hooks';
import React, { memo } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import mockInitialState, {
  Fixture,
  FixtureEndpoint,
} from '@rest-hooks/test/mockState';
import MockResolver from '@rest-hooks/test/MockResolver';
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
      /** @deprecated */
      results?: Fixture[];
      initialFixtures?: FixtureEndpoint[];
      resolverFixtures?: FixtureEndpoint[];
      wrapper?: React.ComponentType<React.PropsWithChildren<P>>;
    },
  ) {
    const initialState = options?.initialFixtures
      ? mockInitialState(options.initialFixtures)
      : options?.results && mockInitialState(options.results);
    const Provider: React.ComponentType<any> = makeProvider(
      [manager, subManager],
      initialState,
    );
    const ProviderWithResolver: React.ComponentType<any> =
      options?.resolverFixtures
        ? memo(function ProviderWithResolver({
            children,
          }: React.PropsWithChildren<P>) {
            return (
              <Provider>
                <MockResolver
                  fixtures={options.resolverFixtures as FixtureEndpoint[]}
                >
                  {children}
                </MockResolver>
              </Provider>
            );
          })
        : Provider;

    const Wrapper = options?.wrapper;
    const wrapper = Wrapper
      ? function ProviderWrapped(props: React.PropsWithChildren<P>) {
          return (
            <ProviderWithResolver>
              <Wrapper {...props} />
            </ProviderWithResolver>
          );
        }
      : ProviderWithResolver;

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
