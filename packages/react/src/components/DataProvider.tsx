'use client';
import {
  initialState as defaultState,
  Controller as DataController,
  applyManager,
} from '@data-client/core';
import type { State, Manager } from '@data-client/core';
import React, { useCallback, useMemo, useRef } from 'react';
import type { JSX } from 'react';

import DataStore from './DataStore.js';
import type { DevToolsPosition } from './DevToolsButton.js';
import { getDefaultManagers } from './getDefaultManagers.js';
import { SSR } from './LegacyReact.js';
import { renderDevButton } from './renderDevButton.js';
import { ControllerContext } from '../context.js';
import { DevToolsManager } from '../managers/index.js';

export interface ProviderProps {
  children: React.ReactNode;
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: typeof DataController;
  devButton?: DevToolsPosition | null | undefined;
}

interface Props {
  children: React.ReactNode;
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: typeof DataController;
  devButton?: DevToolsPosition | null | undefined;
}

/**
 * Manages state, providing all context needed to use the hooks.
 * @see https://dataclient.io/docs/api/DataProvider
 */
export default function DataProvider({
  children,
  managers,
  initialState = defaultState as State<unknown>,
  Controller = DataController,
  devButton = 'bottom-right',
}: Props): JSX.Element {
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production' && SSR) {
    console.warn(
      `DataProvider from @data-client/react does not update while doing SSR.
See https://dataclient.io/docs/guides/ssr.`,
    );
  }
  // contents of this component expected to be relatively stable
  const controllerRef: React.RefObject<DataController> = useRef<any>(undefined);
  if (!controllerRef.current) controllerRef.current = new Controller();
  //TODO: bind all methods so destructuring works

  const managersRef: React.RefObject<Manager[]> = useRef<any>(managers);
  if (!managersRef.current) managersRef.current = getDefaultManagers();

  // run in a useEffect in DataStore
  const mgrEffect = useCallback(() => {
    managersRef.current.forEach(manager => {
      manager.init?.(initialState);
    });
    controllerRef.current.gcPolicy.init();
    return () => {
      managersRef.current.forEach(manager => {
        manager.cleanup();
      });
      controllerRef.current.gcPolicy.cleanup();
    };
    // we don't support initialState changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, managersRef.current);

  // Makes manager middleware compatible with redux-style middleware (by a wrapper enhancement to provide controller API)
  const middlewares = useMemo(
    () => applyManager(managersRef.current, controllerRef.current),
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
      >
        {children}
      </DataStore>
      {renderDevButton(devButton, hasDevManager)}
    </ControllerContext.Provider>
  );
}
