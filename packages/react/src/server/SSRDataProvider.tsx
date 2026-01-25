'use client';
import { State, ActionTypes, Controller } from '@data-client/core';
import { useMemo } from 'react';

import type { DevToolsPosition } from '../components/DevToolsButton.js';
import { renderDevButton } from '../components/renderDevButton.js';
import {
  ControllerContext,
  StoreContext,
  UniversalSuspense,
} from '../index.js';

interface Store<S> {
  subscribe(listener: () => void): () => void;
  dispatch: (value: ActionTypes) => any;
  getState(): S;
}
interface Props<S> extends Store<S> {
  children: React.ReactNode;
  devButton?: DevToolsPosition | null | undefined;
  hasDevManager: boolean;
}

/**
 * Like DataProvider, but for SSR
 */
export default function SSRDataProvider({
  children,
  subscribe,
  dispatch,
  getState,
  devButton,
  hasDevManager = true,
}: Props<State<any>>) {
  const controller = useMemo(() => new Controller({ dispatch }), [dispatch]);
  const store = useMemo(() => ({ subscribe, getState }), [subscribe, getState]);

  return (
    <StoreContext.Provider value={store}>
      <ControllerContext.Provider value={controller}>
        <UniversalSuspense fallback={null}>{children}</UniversalSuspense>
        {renderDevButton(devButton, hasDevManager)}
      </ControllerContext.Provider>
    </StoreContext.Provider>
  );
}
