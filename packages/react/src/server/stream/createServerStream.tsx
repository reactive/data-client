'use client';
import {
  Controller,
  applyManager,
  createReducer,
  initialState,
  initManager,
} from '@data-client/core';
import type { Manager, State } from '@data-client/core';
import React from 'react';
import type { JSX } from 'react';

import { ServerLedgerContext, serverWrap } from './boundary.js';
import { createServerLedger } from './ServerLedger.js';
import type { ServerLedger } from './ServerLedger.js';
import { BoundaryContext } from '../../components/BoundaryContext.js';
import { NetworkManager } from '../../managers/index.js';
import PromiseifyMiddleware from '../redux/PromiseifyMiddleware.js';
import { applyMiddleware, createStore } from '../redux/redux.js';
import SSRDataProvider from '../SSRDataProvider.js';

export interface ServerStream {
  /** Provides the request's store, its ledger and the server wrap */
  Provider: (props: { children: React.ReactNode }) => JSX.Element;
  ledger: ServerLedger;
  controller: Controller;
}

/** One call per request */
export default function createServerStream(
  createManagers: () => Manager[] = () => [new NetworkManager()],
): ServerStream {
  const ledger = createServerLedger();
  const controller = new Controller();
  const managers = [ledger.manager, ...createManagers()];
  const store = createStore(
    createReducer(controller),
    initialState as any,
    applyMiddleware(
      // redux 5's types do not allow any return type from next; see createPersistedStore
      ...(applyManager(managers, controller) as any[]),
      PromiseifyMiddleware as any,
    ),
  );
  const getState = store.getState as () => State<unknown>;
  ledger.attach({ getState, subscribe: store.subscribe });
  initManager(managers, controller)();

  function Provider({ children }: { children: React.ReactNode }) {
    return (
      <ServerLedgerContext.Provider value={ledger}>
        <BoundaryContext.Provider value={serverWrap}>
          <SSRDataProvider
            getState={getState}
            subscribe={store.subscribe}
            dispatch={store.dispatch as any}
            hasDevManager={false}
          >
            {children}
          </SSRDataProvider>
        </BoundaryContext.Provider>
      </ServerLedgerContext.Provider>
    );
  }
  return { Provider, ledger, controller };
}
