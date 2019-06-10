import React, { ReactNode, useEffect, useState } from 'react';
import { StateContext, DispatchContext } from '../context';
import { State, ActionTypes } from '../../types';

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
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(selector(store.getState()));
    });
    return unsubscribe;
    // we don't care to recompute if they change selector - only when store updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);
  return (
    <DispatchContext.Provider value={store.dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}
