import React, { ReactNode, useEffect, useState, useMemo } from 'react';
import {
  StateContext,
  DispatchContext,
} from 'rest-hooks/react-integration/context';
import masterReducer from 'rest-hooks/state/reducer';
import { State, ActionTypes } from 'rest-hooks/types';

import usePromisifiedDispatch from './usePromisifiedDispatch';

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
    () => state.optimistic.reduce(masterReducer, state),
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
