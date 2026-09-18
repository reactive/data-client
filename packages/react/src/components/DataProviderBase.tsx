'use client';
import {
  initialState as defaultState,
  Controller as DataController,
  applyManager,
  initManager,
} from '@data-client/core';
import type { State, Manager } from '@data-client/core';
import React, { useCallback, useMemo, useRef } from 'react';
import type { JSX } from 'react';

import type { ProviderProps } from './DataProvider.js';
import DataStore from './DataStore.js';
import type { ReducerFactory } from './DataStore.js';
import { getDefaultManagers } from './getDefaultManagers.js';
import { renderDevButton } from './renderDevButton.js';
import { ControllerContext } from '../context.js';
import { DevToolsManager } from '../managers/index.js';
import GCPolicy from '../state/GCPolicy.js';

export interface DataProviderBaseProps extends ProviderProps {
  reducerFactory: ReducerFactory;
}

/**
 * Manager/controller/GC lifecycle shared by public DataProvider and
 * streaming adapters. Adapters supply the reducer; this module has no
 * snapshot prop or snapshot Context.
 */
export default function DataProviderBase({
  children,
  managers,
  gcPolicy,
  initialState = defaultState as State<unknown>,
  Controller = DataController,
  devButton = 'bottom-right',
  reducerFactory,
}: DataProviderBaseProps): JSX.Element {
  const gcRef: React.RefObject<GCPolicy> = useRef<any>(gcPolicy);
  if (!gcRef.current) gcRef.current = new GCPolicy();

  // contents of this component expected to be relatively stable
  const controllerRef: React.RefObject<DataController> = useRef<any>(undefined);
  if (!controllerRef.current)
    controllerRef.current = new Controller({ gcPolicy: gcRef.current });
  //TODO: bind all methods so destructuring works

  const managersRef: React.RefObject<Manager[]> = useRef<any>(undefined);
  if (!managersRef.current)
    managersRef.current =
      typeof managers === 'function' ? managers() : (
        (managers ?? getDefaultManagers())
      );

  // run in a useEffect in DataStore
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mgrEffect = useCallback(
    initManager(managersRef.current, controllerRef.current, initialState),
    // we don't support initialState changes
    managersRef.current,
  );

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
        reducerFactory={reducerFactory}
      >
        {children}
      </DataStore>
      {renderDevButton(devButton, hasDevManager)}
    </ControllerContext.Provider>
  );
}
