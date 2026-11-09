'use client';
import React, {
  version,
  useReducer,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';

import { ReducerAction } from './ReducerAction.js';
import { Middleware, Dispatch } from './types.js';
import usePromisifiedDispatch from './usePromisifiedDispatch.js';

/* istanbul ignore next */
const LegacyReact = parseInt(version) < 18;

/* istanbul ignore next */
const useCommitEffect: typeof useEffect =
  // runs while React commits, before every layout and passive Effect; also under a hidden <Activity>
  React.useInsertionEffect ??
  // React 16/17: before every passive Effect; useLayoutEffect warns during SSR
  (typeof window !== 'undefined' ? useLayoutEffect : useEffect);

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

  // Before any other Effect of this commit, so children's Effects (which run first) read it too
  useCommitEffect(() => {
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

  // React 16/17 warn about state updates after unmount (#1085), so drop dispatches there (even in other middlewares).
  // Only there: React 18 removed the warning, and its Effect cleanup also runs when <Activity> hides a provider,
  // which must keep dispatching.
  useEffect(() => {
    /* istanbul ignore if */
    if (LegacyReact) {
      protectedDispatchRef.current = outerDispatchRef.current;
      return () => {
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
    }
  }, [outerDispatch]);

  return [state, outerDispatch, getState];
}

const compose = (fns: ((...args: any) => any)[]) => (initial: any) =>
  fns.reduceRight((v, f) => f(v), initial);
