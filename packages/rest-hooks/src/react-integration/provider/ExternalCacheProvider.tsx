import {
  StateContext,
  DispatchContext,
  reducer,
  State,
  ActionTypes,
} from '@rest-hooks/core';
import { usePromisifiedDispatch } from '@rest-hooks/use-enhanced-reducer';
import React, { ReactNode, useEffect, useState, useMemo } from 'react';

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
  const [state, setState] = useState(() => selector(store.getState()));

  const optimisticState = useMemo(
    () => state.optimistic.reduce(reducer, state),
    [state],
  );

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(selector(store.getState()));
    });
    return unsubscribe;
    // we don't care to recompute if they change selector - only when store updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const dispatch = usePromisifiedDispatch(store.dispatch, state);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={optimisticState}>
        {children}
      </StateContext.Provider>
    </DispatchContext.Provider>
  );
}
