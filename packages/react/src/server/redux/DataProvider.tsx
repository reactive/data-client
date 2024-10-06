'use client';
import {
  DevToolsManager,
  type Controller,
  type Manager,
  type State,
} from '@data-client/core';
import React, { useEffect, useMemo } from 'react';

import ExternalCacheProvider from './ExternalDataProvider.js';
import { prepareStore } from './prepareStore.js';
import { DevToolsPosition } from '../../components/DevToolsButton.js';

/** For usage with https://dataclient.io/docs/api/makeRenderDataHook */
export default function ExternalDataProvider({
  children,
  managers,
  initialState,
  Controller,
  devButton = 'bottom-right',
}: Props) {
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

  // only include if they have devtools integrated
  const hasDevManager = !!managers.find(
    manager => manager instanceof DevToolsManager,
  );

  return (
    <ExternalCacheProvider
      store={store}
      selector={selector}
      controller={controller}
      devButton={devButton}
      hasDevManager={hasDevManager}
    >
      {children}
    </ExternalCacheProvider>
  );
}

interface Props {
  children: React.ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
  Controller: typeof Controller;
  devButton?: DevToolsPosition | null | undefined;
}
