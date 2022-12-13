import {
  ExternalCacheProvider,
  PromiseifyMiddleware,
  Controller,
  Manager,
  NetworkManager,
  State,
  __INTERNAL__,
} from '@rest-hooks/redux';
import { useSyncExternalStore } from 'react';
import { createStore, applyMiddleware } from 'redux';

const { createReducer, initialState, applyManager } = __INTERNAL__;

export default function createPersistedStore(managers?: Manager[]) {
  const controller = new Controller();
  managers = managers ?? [new NetworkManager()];
  const nm: NetworkManager = managers.find(
    m => m instanceof NetworkManager,
  ) as any;
  if (nm === undefined)
    throw new Error('managers must include a NetworkManager');
  const reducer = createReducer(controller);
  const enhancer = applyMiddleware(
    ...applyManager(managers, controller),
    PromiseifyMiddleware as any,
  );
  const store = createStore(reducer, initialState as any, enhancer);
  managers.forEach(manager => manager.init?.(store.getState()));

  const selector = (state: any) => state;

  const getState = () => selector(store.getState());
  let firstRender = true;
  function useReadyCacheState(): State<unknown> {
    const inFlightFetches = nm.allSettled();
    if (inFlightFetches) {
      firstRender = false;
      throw inFlightFetches;
    }
    if (firstRender) {
      firstRender = false;
      throw new Promise(resolve => setTimeout(resolve, 10));
    }
    return useSyncExternalStore(store.subscribe, getState, getState);
  }

  function ServerCacheProvider({ children }: { children: React.ReactNode }) {
    return (
      <ExternalCacheProvider
        store={store}
        selector={selector}
        controller={controller}
      >
        {children}
      </ExternalCacheProvider>
    );
  }
  return [ServerCacheProvider, useReadyCacheState, controller, store] as const;
}
