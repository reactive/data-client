import {
  State,
  Manager,
  SubscriptionManager,
  NetworkManager,
  PollingSubscription,
  Controller,
  GCInterface,
} from '@data-client/react';
import { MockController, mockInitialState } from '@data-client/react/mock';
import type { Interceptor, Fixture } from '@data-client/react/mock';
import React, { memo, Suspense, useLayoutEffect, useState } from 'react';

import { renderHook, act } from './renderHook.cjs';
import type { RenderHookOptions } from './renderHookOptions.js';
import type { RenderHookResult } from './renderHookTypes.js';

const activeCleanups = new Set<() => void>();

type KickRef = { current?: React.Dispatch<React.SetStateAction<number>> };

/** Sibling that commits even when the hook suspends, so we can schedule a real update. */
function Kick({ kickRef }: { kickRef: KickRef }) {
  const [, setKick] = useState(0);
  useLayoutEffect(() => {
    kickRef.current = setKick;
  }, [kickRef]);
  return null;
}

if (typeof afterEach === 'function') {
  afterEach(() => {
    for (const fn of activeCleanups) fn();
    activeCleanups.clear();
  });
}

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
      managers: createManagers = defaultManagers,
      ...options
    }: {
      initialProps?: P;
      initialFixtures?: Fixture[];
      resolverFixtures?: (Fixture | Interceptor<T>)[];
      getInitialInterceptorData?: () => T;
      managers?: () => Manager[];
      wrapper?: React.ComponentType<React.PropsWithChildren<P>>;
    } & Omit<RenderHookOptions<P>, 'initialProps' | 'wrapper'> = {} as any,
  ): RenderDataHookResult<R, P> => {
    let controller: Controller | undefined;
    /** Wraps dispatches that are typically called declaratively in act() */
    class ActController extends MockController(
      Controller,
      resolverFixtures ?
        {
          fixtures: resolverFixtures,
          getInitialInterceptorData,
        }
      : {},
    ) {
      constructor(...args: ConstructorParameters<typeof Controller>) {
        super(...args);
        // the controller DataProvider made, also when no NetworkManager runs
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        controller = this;
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

    // each call renders one store, so its Managers are created here, where cleanup() can reach them
    const managers = createManagers();
    // cleanup() and allSettled() track the NetworkManager actually in use
    const nm = managers.find(
      (manager): manager is NetworkManager => manager instanceof NetworkManager,
    );
    const cleanup = () => {
      activeCleanups.delete(cleanup);
      if (nm) {
        // NetworkManager resolves responses that land after cleanup(), so settle in-flight fetches here
        // to keep them out of the next test.
        nm['fetching'].forEach(({ reject }) => reject());
        nm['clearAll']();
      }
      managers.forEach(manager => manager.cleanup());
    };
    const allSettled = () => {
      return nm?.allSettled();
    };
    activeCleanups.add(cleanup);
    renderDataClient.cleanup = cleanup;
    renderDataClient.allSettled = allSettled;

    const initialState: State<unknown> = mockInitialState(initialFixtures);

    const ProviderWithResolver: React.ComponentType<any> = memo(
      function ProviderWithResolver({ children }: React.PropsWithChildren<P>) {
        return (
          <Provider
            initialState={initialState}
            Controller={ActController}
            managers={() => managers}
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

    const kickRef: KickRef = {};
    const wrapper: React.ComponentType<any> = ({
      children,
      ...props
    }: React.PropsWithChildren<P>) => (
      <ProviderWithWrapper {...(props as any)}>
        <Suspense fallback={null}>{children}</Suspense>
        <Kick kickRef={kickRef} />
      </ProviderWithWrapper>
    );

    const ret: any = renderHook(callback, {
      ...options,
      wrapper,
    });
    // A suspending first render inside sync act() drops the passive-effect task.
    // A real setState gives React a task that flushes those effects. An empty act() does not.
    act(() => {
      kickRef.current?.(count => count + 1);
    });
    ret.controller = controller;
    ret.cleanup = cleanup;
    ret.allSettled = allSettled;
    return ret;
  }) as any;
  renderDataClient.cleanup = () => {};
  renderDataClient.allSettled = () => Promise.allSettled([]);
  return renderDataClient;
}

/** New instances for each render, so manager state never leaks between tests */
function defaultManagers(): Manager[] {
  return [new NetworkManager(), new SubscriptionManager(PollingSubscription)];
}
export interface DataProviderProps {
  children: React.ReactNode;
  managers: () => Manager[];
  initialState: State<unknown>;
  Controller: new (props: { gcPolicy: GCInterface }) => Controller<any>;
  devButton: any;
}

export type RenderDataHookResult<R, P> = RenderHookResult<R, P> & {
  controller: Controller;
  cleanup: () => void;
  allSettled: () => Promise<PromiseSettledResult<unknown>[]> | undefined;
};

export type RenderDataHook = (<P, R>(
  callback: (props: P) => R,
  options?: {
    initialProps?: P;
    initialFixtures?: readonly Fixture[];
    readonly resolverFixtures?: readonly (Fixture | Interceptor)[];
    /** Returns the Managers for each renderDataHook() call, replacing the default NetworkManager and SubscriptionManager */
    managers?: () => Manager[];
    wrapper?: React.ComponentType<React.PropsWithChildren<P>>;
  } & Omit<RenderHookOptions<P>, 'initialProps' | 'wrapper'>,
) => RenderDataHookResult<R, P>) & {
  /** @deprecated use per-render cleanup returned from renderDataClient() instead */
  cleanup: () => void;
  /** @deprecated use per-render allSettled returned from renderDataClient() instead */
  allSettled: () => Promise<PromiseSettledResult<unknown>[]> | undefined;
};
