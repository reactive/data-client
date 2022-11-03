import {
  StateContext,
  DispatchContext,
  ControllerContext,
  createReducer,
  State,
  ActionTypes,
  usePromisifiedDispatch,
  DenormalizeCacheContext,
  Controller,
  BackupBoundary,
} from '@rest-hooks/core';
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from 'react';

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

export default function ExternalCacheProvider<S>({
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
  useMemo(() => {
    controller.getState = selectState;
  }, [controller, selectState]);

  const [state, setState] = useState(selectState);

  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      if (isMounted.current) setState(selectState());
    });
    return unsubscribe;
  }, [selectState, store]);

  const dispatch = usePromisifiedDispatch(store.dispatch, state);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        <ControllerContext.Provider value={controller}>
          <DenormalizeCacheContext.Provider value={controller.globalCache}>
            <BackupBoundary>{children}</BackupBoundary>
          </DenormalizeCacheContext.Provider>
        </ControllerContext.Provider>
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}
