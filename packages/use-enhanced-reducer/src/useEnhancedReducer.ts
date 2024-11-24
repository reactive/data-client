'use client';
import React, {
  useReducer,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from 'react';

import { ReducerAction } from './ReducerAction.js';
import { Middleware, Dispatch } from './types.js';
import usePromisifiedDispatch from './usePromisifiedDispatch.js';

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
  (value: ReducerAction<R>) => Promise<any>,
  () => React.ReducerState<R>,
] {
  const stateRef = useRef(startingState);
  const [state, realDispatch] = useReducer(reducer, startingState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getState = useCallback(() => stateRef.current, []);

  const dispatchWithPromise = usePromisifiedDispatch(realDispatch, state);

  const outerDispatchRef = useRef<Dispatch<R>>(unsetDispatch);
  // protected from dispatches after unmount
  const protectedDispatchRef = useRef<Dispatch<R>>(outerDispatchRef.current);

  const outerDispatch = useMemo(() => {
    // closure here around dispatch allows us to change it after middleware is constructed
    const middlewareAPI = {
      getState,
      dispatch: (action: ReducerAction<R>) =>
        protectedDispatchRef.current(action),
    };
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    protectedDispatchRef.current = outerDispatchRef.current =
      compose(chain)(dispatchWithPromise);
    return outerDispatchRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatchWithPromise, ...middlewares]);

  // dispatching after unmount should be ignored - even by other middlewares
  // using a ref allows symmetric implementation of dispatch indirection to ensure
  // calling useEffect() multiple times has no adverse effects
  useEffect(() => {
    protectedDispatchRef.current = outerDispatchRef.current;
    return () => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        protectedDispatchRef.current = (action: any) => {
          console.info(
            'Action dispatched after unmount. This will be ignored.',
          );
          console.info(JSON.stringify(action, undefined, 2));
          return Promise.resolve();
        };
      } else {
        protectedDispatchRef.current = () => Promise.resolve();
      }
    };
  }, [outerDispatch]);

  return [state, outerDispatch, getState];
}

const compose = (fns: ((...args: any) => any)[]) => (initial: any) =>
  fns.reduceRight((v, f) => f(v), initial);
