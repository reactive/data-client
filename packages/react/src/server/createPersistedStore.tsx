'use client';
import { Manager, State } from '@data-client/core';
import { useSyncExternalStore } from 'react';

import createServerStore from './createServerStore.js';
import SSRDataProvider from './SSRDataProvider.js';

export default function createPersistedStore(
  managers?: Manager[],
  hasDevManager: boolean = true,
) {
  const { store, controller, networkManager } = createServerStore(managers);

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
      <SSRDataProvider
        getState={store.getState}
        subscribe={store.subscribe}
        dispatch={store.dispatch}
        hasDevManager={hasDevManager}
      >
        {children}
      </SSRDataProvider>
    );
  }
  return [ServerDataProvider, useReadyCacheState, controller, store] as const;
}
