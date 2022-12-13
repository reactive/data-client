import {
  State,
  Manager,
  SubscriptionManager,
  NetworkManager,
  PollingSubscription,
  Controller,
  actionTypes,
} from '@rest-hooks/react';
import React, { memo, Suspense } from 'react';

import MockResolver from './MockResolver.js';
import mockInitialState, { Fixture, FixtureEndpoint } from './mockState.js';
import { renderHook, act, RenderHookResult } from './renderHook.cjs';

export default function makeRenderRestHook(
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

  const renderRestHook: RenderRestHook = (<P, R>(
    callback: (props: P) => R,
    options?: {
      initialProps?: P;
      /** @deprecated */
      results?: Fixture[];
      initialFixtures?: FixtureEndpoint[];
      resolverFixtures?: FixtureEndpoint[];
      wrapper?: React.ComponentType<React.PropsWithChildren<P>>;
    },
  ): RenderHookResult<R, P> & { controller: Controller } => {
    // we want fresh manager state in each instance
    const managers = [
      new NetworkManager(),
      new SubscriptionManager(PollingSubscription),
    ];
    renderRestHook.cleanup = () => {
      (managers[0] as any).cleanupDate = Infinity;
      Object.values(
        (managers[0] as any).rejectors as Record<string, any>,
      ).forEach(rej => {
        rej();
      });
      (managers[0] as any).clearAll();
    };
    renderRestHook.allSettled = async () => {
      return (managers[0] as NetworkManager).allSettled();
    };

    const initialState: State<unknown> = options?.initialFixtures
      ? (mockInitialState(options.initialFixtures) as any)
      : options?.results && mockInitialState(options.results);

    // TODO: controller provided to middleware should be same as useController() - so pull out the mockresolver stuff and don't actually
    // use the component here
    const ProviderWithResolver: React.ComponentType<any> =
      options?.resolverFixtures
        ? memo(function ProviderWithResolver({
            children,
          }: React.PropsWithChildren<P>) {
            return (
              <Provider
                initialState={initialState}
                Controller={ActController}
                managers={managers}
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
              >
                {children}
              </Provider>
            );
          });

    const Wrapper = options?.wrapper;
    const ProviderWithWrapper = Wrapper
      ? function ProviderWrapped(props: React.PropsWithChildren<P>) {
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
    ret.controller = (managers[0] as any).controller;
    return ret;
  }) as any;
  renderRestHook.cleanup = () => {};
  renderRestHook.allSettled = () => Promise.resolve();
  return renderRestHook;
}
interface ProviderProps {
  children: React.ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
  Controller: typeof Controller;
}

type RenderRestHook = (<P, R>(
  callback: (props: P) => R,
  options?: {
    initialProps?: P;
    results?: Fixture[];
    initialFixtures?: FixtureEndpoint[];
    resolverFixtures?: FixtureEndpoint[];
    wrapper?: React.ComponentType<React.PropsWithChildren<P>>;
  },
) => RenderHookResult<R, P> & {
  controller: Controller;
}) & { cleanup: () => void; allSettled: () => Promise<unknown> };
