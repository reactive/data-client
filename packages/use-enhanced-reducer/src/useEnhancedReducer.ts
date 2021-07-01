import React, { useReducer, useMemo, useRef, useEffect } from 'react';

import { Middleware, MiddlewareAPI } from './types';
import usePromisifiedDispatch from './usePromisifiedDispatch';

/** Similar to useReducer(), but with redux-like middleware
 *
 * Supports async operations in concurrent mode by returning a promise on dispatch
 * Promise resolves when results are committed
 */
export default function useEnhancedReducer<R extends React.Reducer<any, any>>(
  reducer: R,
  startingState: React.ReducerState<R>,
  middlewares: Middleware[],
): [React.ReducerState<R>, (value: React.ReducerAction<R>) => Promise<any>] {
  const stateRef = useRef(startingState);
  const [state, realDispatch] = useReducer(reducer, startingState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const dispatchWithPromise = usePromisifiedDispatch(realDispatch, state);

  const outerDispatch = useMemo(() => {
    // closure here around dispatch allows us to change it after middleware is constructed
    const middlewareAPI: MiddlewareAPI<R> = {
      getState: () => stateRef.current,
      dispatch: () => {
        throw new Error(
          `Dispatching while constructing your middleware is not allowed. ` +
            `Other middleware would not be applied to this dispatch.`,
        );
      },
    };
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    return (middlewareAPI.dispatch = compose(chain)(dispatchWithPromise));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatchWithPromise, ...middlewares]);
  return [state, outerDispatch];
}

const compose = (fns: ((...args: any) => any)[]) => (initial: any) =>
  fns.reduceRight((v, f) => f(v), initial);
