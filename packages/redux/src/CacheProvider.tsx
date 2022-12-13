import { Controller, Manager, State } from '@rest-hooks/react';
import { useEffect, useMemo } from 'react';

import ExternalCacheProvider from './ExternalCacheProvider.js';
import { prepareStore } from './prepareStore.js';

interface ProviderProps {
  children: React.ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
  Controller: typeof Controller;
}
export default function CacheProvider({
  children,
  managers,
  initialState,
  Controller,
}: ProviderProps) {
  const { selector, store, controller } = useMemo(
    () => prepareStore(initialState, managers, Controller),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Controller, ...managers],
  );

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
    // we're ignoring state here, because it shouldn't trigger inits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...managers]);

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
