'use client';
import {
  State,
  ActionTypes,
  Controller,
  createReducer,
} from '@data-client/core';
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from 'react';

import type { DevToolsPosition } from '../../components/DevToolsButton.js';
import { renderDevButton } from '../../components/renderDevButton.js';
import {
  ControllerContext,
  StoreContext,
  BackupLoading,
  UniversalSuspense,
  StateContext,
} from '../../index.js';

interface Store<S> {
  subscribe(listener: () => void): () => void;
  getState(): S;
}
interface Props<S> {
  children: React.ReactNode;
  store: Store<S>;
  selector: (state: S) => State<unknown>;
  controller: Controller;
  devButton?: DevToolsPosition | null | undefined;
  hasDevManager?: boolean;
}

/**
 * Like DataProvider, but for an external store
 * @see https://dataclient.io/docs/api/ExternalDataProvider
 */
export default function ExternalDataProvider<S>({
  children,
  store,
  selector,
  controller,
  devButton = 'bottom-right',
  hasDevManager = false,
}: Props<S>) {
  const masterReducer = useMemo(() => createReducer(controller), [controller]);
  const selectState = useCallback(() => {
    const state = selector(store.getState());
    return state.optimistic.reduce(masterReducer, state);
  }, [masterReducer, selector, store]);

  const [state, setState] = useState(selectState);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      if (isMounted.current) setState(selectState());
    });
    return unsubscribe;
  }, [selectState, store]);

  const adaptedStore = useMemo(() => {
    return { ...store, getState: () => selector(store.getState()) };
  }, [selector, store]);

  return (
    <StateContext.Provider value={state}>
      <StoreContext.Provider value={adaptedStore}>
        <ControllerContext.Provider value={controller}>
          <UniversalSuspense fallback={<BackupLoading />}>
            {children}
          </UniversalSuspense>
          {renderDevButton(devButton, hasDevManager)}
        </ControllerContext.Provider>
      </StoreContext.Provider>
    </StateContext.Provider>
  );
}
