import React from 'react';
import {
  State,
  reducer,
  ExternalCacheProvider,
  CacheProvider,
  Manager,
} from '..';

// Extension of the DeepPartial type defined by Redux which handles unknown
type DeepPartialWithUnknown<T> = {
  [K in keyof T]?: T[K] extends unknown
    ? any
    : (T[K] extends object ? DeepPartialWithUnknown<T[K]> : T[K]);
};

let makeExternalCacheProvider: (
  managers: Manager[],
  initialState?: DeepPartialWithUnknown<State<any>>,
) => (props: { children: React.ReactNode }) => JSX.Element;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createStore, applyMiddleware } = require('redux');
  makeExternalCacheProvider = (
    managers: Manager[],
    initialState?: DeepPartialWithUnknown<State<any>>,
  ) => {
    const store = createStore(
      reducer,
      initialState,
      applyMiddleware(...managers.map(manager => manager.getMiddleware())),
    );

    return function ConfiguredExternalCacheProvider({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <ExternalCacheProvider store={store} selector={(s: State<any>) => s}>
          {children}
        </ExternalCacheProvider>
      );
    };
  };
} catch (e) {
  makeExternalCacheProvider = (
    managers: Manager[],
    initialState?: DeepPartialWithUnknown<State<any>>,
  ): ((props: { children: React.ReactNode }) => JSX.Element) => {
    throw new Error(
      'Using makeExternalCacheProvider() requires redux to be installed as a peerDependency to rest-hooks',
    );
  };
}

const makeCacheProvider = (
  managers: Manager[],
  initialState?: State<unknown>,
) => {
  return function ConfiguredCacheProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <CacheProvider managers={managers} initialState={initialState}>
        {children}
      </CacheProvider>
    );
  };
};

export { makeExternalCacheProvider, makeCacheProvider };
