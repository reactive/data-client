import { State, Manager } from '@rest-hooks/core';
import { SubscriptionManager } from 'rest-hooks';
import React, { memo, Suspense } from 'react';
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
    const initialState =
      options && options.results && mockInitialState(options.results);
    const Provider: React.ComponentType<any> = makeProvider(
      [manager, subManager],
      initialState,
    );
    const Wrapper = options && options.wrapper;
    const ProviderWithWrapper: React.ComponentType<any> = Wrapper
      ? function ProviderWrapped(props: React.PropsWithChildren<P>) {
          return (
            <Provider>
              <Wrapper {...props} />
            </Provider>
          );
        }
      : Provider;

    const wrapper: React.ComponentType<any> = ({
      children,
      ...props
    }: React.PropsWithChildren<P>) => (
      <ProviderWithWrapper {...(props as any)}>
        <Suspense fallback={null}>{children}</Suspense>
      </ProviderWithWrapper>
    );

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
