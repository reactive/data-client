'use client';
import { DevToolsManager, GCInterface, initManager } from '@data-client/core';
import type { Controller, Manager, State } from '@data-client/core';
import React, { useEffect, useRef } from 'react';

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
  // StrictMode runs useMemo and useState initializers twice and keeps the first result, but the
  // second call binds the managers last; a ref builds the store once
  const storeRef = useRef<ReturnType<typeof prepareStore>>(undefined);
  if (!storeRef.current)
    storeRef.current = prepareStore(
      initialState,
      managers,
      Controller,
      {},
      [],
      gcPolicy,
    );
  const {
    selector,
    store,
    controller,
    managers: storeManagers,
  } = storeRef.current;

  // this is not handled in ExternalCacheProvider as it doesn't
  // own its managers. Since we are owning them here, we should ensure it happens
  useEffect(initManager(storeManagers, controller), [
    storeManagers,
    controller,
  ]);

  // only include if they have devtools integrated
  const hasDevManager = !!storeManagers.find(
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
  /** Returns new Managers; called once for each store. An array (deprecated) is shared by every store that uses it. */
  managers: (() => Manager[]) | Manager[];
  initialState: State<unknown>;
  Controller: new (props: { gcPolicy: GCInterface }) => Controller;
  gcPolicy?: GCInterface;
  devButton?: DevToolsPosition | null | undefined;
}
