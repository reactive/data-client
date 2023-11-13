import {
  State,
  Manager,
  SubscriptionManager,
  NetworkManager,
  PollingSubscription,
  Controller,
} from '@data-client/react';
import React, { memo, Suspense } from 'react';

import { renderHook, act, RenderHookResult } from './renderHook.cjs';
import { createControllerInterceptor } from '../createControllerInterceptor.js';
import { createFixtureMap } from '../createFixtureMap.js';
import { Interceptor, Fixture, FixtureEndpoint } from '../fixtureTypes.js';
import MockResolver from '../MockResolver.js';
import mockInitialState from '../mockState.js';

export type { RenderHookOptions } from './renderHook.cjs';

export default function makeRenderDataClient(
  Provider: React.ComponentType<ProviderProps>,
) {
  /** Wraps dispatches that are typically called declaratively in act() */
  class ActController extends Controller<any> {
    constructor(...args: any) {
      super(...args);
      const { setResponse, resolve } = this;
      this.setResponse = (...args) => {
        let promise: any;
        act(() => {
          promise = setResponse.call(this, ...args);
        });
        return promise;
      };
      this.resolve = (...args) => {
        let promise: any;
        act(() => {
          promise = resolve.call(this, ...args);
        });
        return promise;
      };
    }
  }

  const renderDataClient: RenderDataClient = (<P, R, T = any>(
    callback: (props: P) => R,
    options?: {
      initialProps?: P;
      initialFixtures?: Fixture[];
      resolverFixtures?: (Fixture | Interceptor<T>)[];
      getInitialInterceptorData?: () => T;
      wrapper?: React.ComponentType<React.PropsWithChildren<P>>;
    },
  ): RenderHookResult<R, P> & { controller: Controller } => {
    // we want fresh manager state in each instance
    const managers = [
      new NetworkManager(),
      new SubscriptionManager(PollingSubscription),
    ];
    renderDataClient.cleanup = () => {
      (managers[0] as any).cleanupDate = Infinity;
      Object.values(
        (managers[0] as any).rejectors as Record<string, any>,
      ).forEach(rej => {
        rej();
      });
      (managers[0] as any).clearAll();
      managers.forEach(manager => manager.cleanup());
    };
    renderDataClient.allSettled = () => {
      return (managers[0] as NetworkManager).allSettled();
    };

    const initialState: State<unknown> = mockInitialState(
      options?.initialFixtures,
    );

    // TODO: controller provided to middleware should be same as useController() - so pull out the mockresolver stuff and don't actually
    // use the component here
    const ProviderWithResolver: React.ComponentType<any> =
      options?.resolverFixtures?.length ?
        memo(function ProviderWithResolver({
          children,
        }: React.PropsWithChildren<P>) {
          return (
            <Provider
              initialState={initialState}
              Controller={ActController}
              managers={managers}
              devButton={null}
            >
              <MockResolver
                fixtures={options.resolverFixtures as FixtureEndpoint[]}
              >
                {children}
              </MockResolver>
            </Provider>
          );
        })
      : memo(function ProviderWithResolver({
          children,
        }: React.PropsWithChildren<P>) {
          return (
            <Provider
              initialState={initialState}
              Controller={ActController}
              managers={managers}
              devButton={null}
            >
              {children}
            </Provider>
          );
        });

    const Wrapper = options?.wrapper;
    const ProviderWithWrapper =
      Wrapper ?
        function ProviderWrapped(props: React.PropsWithChildren<P>) {
          return (
            <ProviderWithResolver>
              <Wrapper {...props} />
            </ProviderWithResolver>
          );
        }
      : ProviderWithResolver;

    const wrapper: React.ComponentType<any> = ({
      children,
      ...props
    }: React.PropsWithChildren<P>) => (
      <ProviderWithWrapper {...(props as any)}>
        <Suspense fallback={null}>{children}</Suspense>
      </ProviderWithWrapper>
    );

    const ret: any = renderHook(callback, {
      ...options,
      wrapper,
    });
    const [fixtureMap, interceptors] = createFixtureMap(
      options?.resolverFixtures,
    );
    ret.controller = createControllerInterceptor(
      (managers[0] as any).controller,
      fixtureMap,
      interceptors,
      options?.getInitialInterceptorData ?? (() => ({})),
      !options?.resolverFixtures?.length,
    );
    return ret;
  }) as any;
  renderDataClient.cleanup = () => {};
  renderDataClient.allSettled = () => Promise.allSettled([]);
  return renderDataClient;
}
interface ProviderProps {
  children: React.ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
  Controller: typeof Controller;
  devButton: any;
}

type RenderDataClient = (<P, R>(
  callback: (props: P) => R,
  options?: {
    initialProps?: P;
    initialFixtures?: readonly Fixture[];
    readonly resolverFixtures?: readonly (Fixture | Interceptor)[];
    wrapper?: React.ComponentType<React.PropsWithChildren<P>>;
  },
) => RenderHookResult<R, P> & {
  controller: Controller;
}) & {
  cleanup: () => void;
  allSettled: () => Promise<PromiseSettledResult<unknown>[]> | undefined;
};
