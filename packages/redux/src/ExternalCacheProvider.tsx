import {
  State,
  ActionTypes,
  usePromisifiedDispatch,
  Controller,
  __INTERNAL__,
} from '@rest-hooks/react';
import {
  StateContext,
  DispatchContext,
  ControllerContext,
  StoreContext,
  BackupBoundary,
} from '@rest-hooks/react';
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from 'react';

const { createReducer } = __INTERNAL__;

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
 * Like CacheProvider, but for an external store
 * @see https://resthooks.io/docs/api/ExternalCacheProvider
 */
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
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>
        <StoreContext.Provider value={adaptedStore}>
          <ControllerContext.Provider value={controller}>
            <BackupBoundary>{children}</BackupBoundary>
          </ControllerContext.Provider>
        </StoreContext.Provider>
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}
