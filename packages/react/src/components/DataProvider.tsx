'use client';
import {
  initialState as defaultState,
  Controller as DataController,
  actionTypes,
  applyManager,
  initManager,
} from '@data-client/core';
import type { State, Manager, GCInterface } from '@data-client/core';
import type { Middleware as GenericMiddleware } from '@data-client/use-enhanced-reducer';
import React, { useCallback, useMemo, useRef } from 'react';
import type { JSX } from 'react';

import type ClientStore from './ClientStore.js';
import DataStore from './DataStore.js';
import type { DevToolsPosition } from './DevToolsButton.js';
import { getDefaultManagers } from './getDefaultManagers.js';
import { SSR } from './LegacyReact.js';
import { renderDevButton } from './renderDevButton.js';
import { ControllerContext } from '../context.js';
import { DevToolsManager } from '../managers/index.js';
import GCPolicy from '../state/GCPolicy.js';

export type ProviderProps = {
  children: React.ReactNode;
  devButton?: DevToolsPosition | null | undefined;
} & (
  | {
      managers?: Manager[];
      initialState?: State<unknown>;
      Controller?: new (props: { gcPolicy: GCInterface }) => DataController;
      gcPolicy?: GCInterface;
      store?: undefined;
    }
  | {
      /** Store created outside React; it owns the managers, Controller and state
       * @see https://dataclient.io/docs/api/ClientStore
       */
      store: ClientStore;
      managers?: undefined;
      initialState?: undefined;
      Controller?: undefined;
      gcPolicy?: undefined;
    }
);

/**
 * Manages state, providing all context needed to use the hooks.
 * @see https://dataclient.io/docs/api/DataProvider
 */
export default function DataProvider({
  children,
  managers,
  gcPolicy,
  initialState = defaultState as State<unknown>,
  Controller = DataController,
  devButton = 'bottom-right',
  store,
}: ProviderProps): JSX.Element {
  const gcRef: React.RefObject<GCPolicy> = useRef<any>(gcPolicy);
  // a store brings its own
  if (!gcRef.current && !store) gcRef.current = new GCPolicy();

  // contents of this component expected to be relatively stable
  const controllerRef: React.RefObject<DataController> = useRef<any>(undefined);
  if (!controllerRef.current)
    controllerRef.current =
      store?.controller ?? new Controller({ gcPolicy: gcRef.current });
  //TODO: bind all methods so destructuring works

  const managersRef: React.RefObject<Manager[]> = useRef<any>(
    store?.managers ?? managers,
  );
  if (!managersRef.current) managersRef.current = getDefaultManagers();

  // run in a useEffect in DataStore; a store runs its own
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mgrEffect = useCallback(
    store ? noop : (
      initManager(managersRef.current, controllerRef.current, initialState)
    ),
    // we don't support initialState changes
    managersRef.current,
  );

  // Makes manager middleware compatible with redux-style middleware (by a wrapper enhancement to provide controller API)
  const middlewares = useMemo(
    () => {
      // a store binds its managers once, outside React
      if (store) return [];
      const middlewares: GenericMiddleware[] = applyManager(
        managersRef.current,
        controllerRef.current,
      );
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production' && SSR)
        middlewares.unshift(warnFetchDuringSSR);
      return middlewares;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    managersRef.current,
  );

  // only include if they have devtools integrated
  const hasDevManager = !!managersRef.current.find(
    manager => manager instanceof DevToolsManager,
  );
  return (
    <ControllerContext.Provider value={controllerRef.current}>
      <DataStore
        mgrEffect={mgrEffect}
        middlewares={middlewares}
        initialState={initialState}
        controller={controllerRef.current}
        store={store}
      >
        {children}
      </DataStore>
      {renderDevButton(devButton, hasDevManager)}
    </ControllerContext.Provider>
  );
}

const noop = () => {};

let warnedFetchDuringSSR = false;
/** Rendering on the server is fine; fetching there is lost since this store never updates */
const warnFetchDuringSSR: GenericMiddleware = () => next => action => {
  if (action.type === actionTypes.FETCH && !warnedFetchDuringSSR) {
    warnedFetchDuringSSR = true;
    console.warn(
      `DataProvider from @data-client/react does not update while doing SSR, so data fetched during SSR will not be rendered.
See https://dataclient.io/docs/guides/ssr.`,
    );
  }
  return next(action);
};
