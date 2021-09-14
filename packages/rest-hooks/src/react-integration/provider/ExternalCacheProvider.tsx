import {
  StateContext,
  DispatchContext,
  ControllerContext,
  reducer,
  State,
  ActionTypes,
  usePromisifiedDispatch,
  DenormalizeCacheContext,
  Controller,
} from '@rest-hooks/core';
import React, { ReactNode, useEffect, useState, useMemo, useRef } from 'react';

interface Store<S> {
  subscribe(listener: () => void): () => void;
  dispatch: React.Dispatch<ActionTypes>;
  getState(): S;
}
interface Props<S> {
  children: ReactNode;
  store: Store<S>;
  selector: (state: S) => State<unknown>;
}

export default function ExternalCacheProvider<S>({
  children,
  store,
  selector,
}: Props<S>) {
  const denormalizeCache = useRef({
    entities: {},
    results: {},
  });
  const [state, setState] = useState(() => selector(store.getState()));

  const optimisticState = useMemo(
    () => state.optimistic.reduce(reducer, state),
    [state],
  );

  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      if (isMounted.current) setState(selector(store.getState()));
    });
    return unsubscribe;
    // we don't care to recompute if they change selector - only when store updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const dispatch = usePromisifiedDispatch(store.dispatch, state);

  const controller = useRef<Controller>();
  if (!controller.current)
    controller.current = new Controller({
      dispatch,
    });

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={optimisticState}>
        <ControllerContext.Provider value={controller.current}>
          <DenormalizeCacheContext.Provider
            value={controller.current.globalCache}
          >
            {children}
          </DenormalizeCacheContext.Provider>
        </ControllerContext.Provider>
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}
