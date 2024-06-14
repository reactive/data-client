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

import {
  ControllerContext,
  StoreContext,
  BackupLoading,
  UniversalSuspense,
  usePromisifiedDispatch,
  StateContext,
} from '../../index.js';

interface Store<S> {
  subscribe(listener: () => void): () => void;
  dispatch: React.Dispatch<ActionTypes>;
  getState(): S;
}
interface Props<S> {
  children: React.ReactNode;
  store: Store<S>;
  selector: (state: S) => State<unknown>;
  controller: Controller;
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
    () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      if (isMounted.current) setState(selectState());
    });
    return unsubscribe;
  }, [selectState, store]);

  const dispatch = usePromisifiedDispatch(store.dispatch, state);

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
          {process.env.NODE_ENV !== 'production' ?
            <UniversalSuspense fallback={null} />
          : undefined}
        </ControllerContext.Provider>
      </StoreContext.Provider>
    </StateContext.Provider>
  );
}
