'use client';
import {
  ExternalDataProvider,
  PromiseifyMiddleware,
  Controller,
  Manager,
  NetworkManager,
  State,
  __INTERNAL__,
} from '@data-client/redux';
import { useSyncExternalStore } from 'react';
import { createStore, applyMiddleware } from 'redux';

const { createReducer, initialState, applyManager } = __INTERNAL__;

export default function createPersistedStore(managers?: Manager[]) {
  const controller = new Controller();
  managers = managers ?? [new NetworkManager()];
  const networkManager: NetworkManager = managers.find(
    m => m instanceof NetworkManager,
  ) as any;
  if (networkManager === undefined)
    throw new Error('managers must include a NetworkManager');
  const reducer = createReducer(controller);
  const enhancer = applyMiddleware(
    // redux 5's types are wrong and do not allow any return typing from next, which is incorrect.
    // `next: (action: unknown) => unknown`: allows any action, but disallows all return types.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ...applyManager(managers, controller),
    PromiseifyMiddleware,
  );
  const store = createStore(reducer, initialState as any, enhancer);
  managers.forEach(manager => manager.init?.(store.getState()));

  const selector = (state: any) => state;

  const getState = () => selector(store.getState());
  let firstRender = true;
  function useReadyCacheState(): State<unknown> {
    const inFlightFetches = networkManager.allSettled();
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

  function ServerDataProvider({ children }: { children: React.ReactNode }) {
    return (
      <ExternalDataProvider
        store={store}
        selector={selector}
        controller={controller}
      >
        {children}
      </ExternalDataProvider>
    );
  }
  return [ServerDataProvider, useReadyCacheState, controller, store] as const;
}
