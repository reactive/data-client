import {
  State,
  Manager,
  SubscriptionManager,
  NetworkManager,
  PollingSubscription,
  Controller,
  GenericDispatch,
  DataClientDispatch,
} from '@data-client/react';
import React, { memo, Suspense } from 'react';

import {
  renderHook,
  act,
  RenderHookResult,
  type RenderHookOptions,
} from './renderHook.cjs';
import { Interceptor, Fixture } from '../fixtureTypes.js';
import { MockController } from '../MockController.js';
import mockInitialState from '../mockState.js';
import { MockProps } from '../mockTypes.js';

/** @see https://dataclient.io/docs/api/makeRenderDataHook */
export default function makeRenderDataHook(
  Provider: React.ComponentType<DataProviderProps>,
) {
  const renderDataClient: RenderDataHook = (<P, R, T = any>(
    callback: (props: P) => R,
    {
      initialFixtures,
      resolverFixtures,
      getInitialInterceptorData = () => ({}) as any,
      ...options
    }: {
      initialProps?: P;
      initialFixtures?: Fixture[];
      resolverFixtures?: (Fixture | Interceptor<T>)[];
      getInitialInterceptorData?: () => T;
      wrapper?: React.ComponentType<React.PropsWithChildren<P>>;
    } & Omit<RenderHookOptions<P>, 'initialProps' | 'wrapper'> = {} as any,
  ): RenderHookResult<R, P> & { controller: Controller } => {
    /** Wraps dispatches that are typically called declaratively in act() */
    class ActController<
      D extends GenericDispatch = DataClientDispatch,
      T = {},
    > extends MockController(
      Controller,
      resolverFixtures ?
        {
          fixtures: resolverFixtures,
          getInitialInterceptorData,
        }
      : {},
    )<D> {
      constructor(
        options: MockProps<T> & ConstructorParameters<typeof Controller<D>>[0],
      ) {
        super(options);
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

    // we want fresh manager state in each instance
    const nm = new NetworkManager();
    const sm = new SubscriptionManager(PollingSubscription);
    const managers = [nm, sm];
    // this pattern is dangerous if renderDataClient is shared between tests
    // TODO: move to return value
    renderDataClient.cleanup = () => {
      nm.cleanupDate = Infinity;
      if ((nm as any)['rejectors'])
        Object.values((nm as any)['rejectors'] as Record<string, any>).forEach(
          rej => {
            rej();
          },
        );
      else if (nm['fetching']) nm['fetching'].forEach(({ reject }) => reject());
      nm['clearAll']();
      managers.forEach(manager => manager.cleanup());
    };
    renderDataClient.allSettled = () => {
      return nm.allSettled();
    };

    const initialState: State<unknown> = mockInitialState(initialFixtures);

    const ProviderWithResolver: React.ComponentType<any> = memo(
      function ProviderWithResolver({ children }: React.PropsWithChildren<P>) {
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
      },
    );

    const Wrapper: React.ComponentType<React.PropsWithChildren<P>> | undefined =
      options?.wrapper;
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
    ret.controller = nm['controller'];
    return ret;
  }) as any;
  renderDataClient.cleanup = () => {};
  renderDataClient.allSettled = () => Promise.allSettled([]);
  return renderDataClient;
}
export interface DataProviderProps {
  children: React.ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
  Controller: typeof Controller<any>;
  devButton: any;
}

export type RenderDataHook = (<P, R>(
  callback: (props: P) => R,
  options?: {
    initialProps?: P;
    initialFixtures?: readonly Fixture[];
    readonly resolverFixtures?: readonly (Fixture | Interceptor)[];
    wrapper?: React.ComponentType<React.PropsWithChildren<P>>;
  } & Omit<RenderHookOptions<P>, 'initialProps' | 'wrapper'>,
) => RenderHookResult<R, P> & {
  controller: Controller;
}) & {
  cleanup: () => void;
  allSettled: () => Promise<PromiseSettledResult<unknown>[]> | undefined;
};
