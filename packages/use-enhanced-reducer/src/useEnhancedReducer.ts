import React, {
  useReducer,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';

import { Middleware, Dispatch } from './types';
import usePromisifiedDispatch from './usePromisifiedDispatch';

export const unsetDispatch = () => {
  throw new Error(
    `Dispatching while constructing your middleware is not allowed. ` +
      `Other middleware would not be applied to this dispatch.`,
  );
};

/** Similar to useReducer(), but with redux-like middleware
 *
 * Supports async operations in concurrent mode by returning a promise on dispatch
 * Promise resolves when results are committed
 */
export default function useEnhancedReducer<R extends React.Reducer<any, any>>(
  reducer: R,
  startingState: React.ReducerState<R>,
  middlewares: Middleware[],
): [
  React.ReducerState<R>,
  (value: React.ReducerAction<R>) => Promise<any>,
  () => React.ReducerState<R>,
] {
  const stateRef = useRef(startingState);
  const [state, realDispatch] = useReducer(reducer, startingState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getState = useCallback(() => stateRef.current, []);

  const dispatchWithPromise = usePromisifiedDispatch(realDispatch, state);

  const outerDispatch = useMemo(() => {
    let dispatch: Dispatch<R> = unsetDispatch;
    // closure here around dispatch allows us to change it after middleware is constructed
    const middlewareAPI = {
      getState,
      dispatch: (action: React.ReducerAction<R>) => dispatch(action),
    };
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = compose(chain)(dispatchWithPromise);
    return dispatch;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatchWithPromise, ...middlewares]);
  return [state, outerDispatch, getState];
}

const compose = (fns: ((...args: any) => any)[]) => (initial: any) =>
  fns.reduceRight((v, f) => f(v), initial);
