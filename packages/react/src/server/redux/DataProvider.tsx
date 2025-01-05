'use client';
import {
  DevToolsManager,
  GCInterface,
  initManager,
  type Controller,
  type Manager,
  type State,
} from '@data-client/core';
import React, { useEffect, useMemo } from 'react';

import ExternalCacheProvider from './ExternalDataProvider.js';
import { prepareStore } from './prepareStore.js';
import { DevToolsPosition } from '../../components/DevToolsButton.js';

/** For usage with https://dataclient.io/docs/api/makeRenderDataHook */
export default function TestExternalDataProvider({
  children,
  managers,
  initialState,
  Controller,
  gcPolicy,
  devButton = 'bottom-right',
}: Props) {
  const { selector, store, controller } = useMemo(
    () => prepareStore(initialState, managers, Controller, {}, [], gcPolicy),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Controller, ...managers],
  );

  // this is not handled in ExternalCacheProvider as it doesn't
  // own its managers. Since we are owning them here, we should ensure it happens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    initManager(managers, controller, selector(store.getState())),
    // we're ignoring state here, because it shouldn't trigger inits
    managers,
  );

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
  gcPolicy?: GCInterface;
  devButton?: DevToolsPosition | null | undefined;
}
