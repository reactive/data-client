import {
  State,
  createReducer,
  CacheProvider,
  Manager,
  Controller,
} from '@rest-hooks/core';
import {
  ExternalCacheProvider,
  PromiseifyMiddleware,
  mapMiddleware,
} from 'rest-hooks';
import React, { useEffect } from 'react';

// Extension of the DeepPartial type defined by Redux which handles unknown
type DeepPartialWithUnknown<T> = {
  [K in keyof T]?: T[K] extends unknown
    ? any
    : T[K] extends object
    ? DeepPartialWithUnknown<T[K]>
    : T[K];
};

let makeExternalCacheProvider: (
  managers: Manager[],
  initialState?: DeepPartialWithUnknown<State<any>>,
) => (props: { children: React.ReactNode }) => JSX.Element;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createStore, applyMiddleware, combineReducers } = require('redux');
  const applyManager =
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@rest-hooks/core').applyManager ??
    ((managers: Manager[]) => managers.map(manager => manager.getMiddleware()));
  makeExternalCacheProvider = function makeExternal(
    managers: Manager[],
    initialState?: DeepPartialWithUnknown<State<any>>,
  ) {
    const selector = (s: { restHooks: State<unknown> }) => s.restHooks;
    const controller = new Controller();
    const reducer = createReducer(controller);
    const store = createStore(
      combineReducers({ restHooks: reducer }),
      { restHooks: initialState },
      applyMiddleware(
        ...mapMiddleware(selector)(...applyManager(managers, controller)),
        PromiseifyMiddleware,
      ),
    );

    return function ConfiguredExternalCacheProvider({
      children,
    }: {
      children: React.ReactNode;
    }) {
      // this is not handled in ExternalCacheProvider as it doesn't
      // own its managers. Since we are owning them here, we should ensure it happens
      useEffect(() => {
        for (let i = 0; i < managers.length; ++i) {
          managers[i].init?.(selector(store.getState()));
        }
        return () => {
          for (let i = 0; i < managers.length; ++i) {
            managers[i].cleanup();
          }
        };
      }, []);

      return (
        <ExternalCacheProvider
          store={store}
          selector={selector}
          controller={controller}
        >
          {children}
        </ExternalCacheProvider>
      );
    };
  };
} catch (e) {
  makeExternalCacheProvider = function makeExternal(
    managers: Manager[],
    initialState?: DeepPartialWithUnknown<State<any>>,
  ): (props: { children: React.ReactNode }) => JSX.Element {
    throw new Error(
      'Using makeExternalCacheProvider() requires redux to be installed as a peerDependency to rest-hooks',
    );
  };
}

function makeCacheProvider(
  managers: Manager[],
  initialState?: State<unknown>,
): (props: { children: React.ReactNode }) => JSX.Element {
  return function ConfiguredCacheProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    if (initialState) {
      return (
        <CacheProvider managers={managers} initialState={initialState}>
          {children}
        </CacheProvider>
      );
    } else {
      return <CacheProvider managers={managers}>{children}</CacheProvider>;
    }
  };
}

export { makeExternalCacheProvider, makeCacheProvider };
