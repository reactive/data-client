import { useReducer, useMemo, useRef, useCallback, useEffect } from 'react';
import { Middleware, Dispatch } from '~/types';

import usePromisifiedDispatch from './usePromisifiedDispatch';

// TODO: release as own library?
/** Redux-middleware compatible integration for useReducer() */
export default function createEnhancedReducerHook(
  ...middlewares: Middleware[]
) {
  const useEnhancedReducer = <R extends React.Reducer<any, any>>(
    reducer: R,
    startingState: React.ReducerState<R>,
  ): [
    React.ReducerState<R>,
    (value: React.ReducerAction<R>) => Promise<any>,
  ] => {
    const stateRef = useRef(startingState);
    const [state, realDispatch] = useReducer(reducer, startingState);

    useEffect(() => {
      stateRef.current = state;
    }, [state]);

    const dispatchWithPromise = usePromisifiedDispatch(realDispatch, state);

    const outerDispatch = useMemo(() => {
      let dispatch: Dispatch<R> = () => {
        throw new Error(
          `Dispatching while constructing your middleware is not allowed. ` +
            `Other middleware would not be applied to this dispatch.`,
        );
      };
      // closure here around dispatch allows us to change it after middleware is constructed
      const middlewareAPI = {
        getState: () => stateRef.current,
        dispatch: (action: React.ReducerAction<R>) => dispatch(action),
      };
      const chain = middlewares.map(middleware => middleware(middlewareAPI));
      dispatch = compose(chain)(dispatchWithPromise);
      return dispatch;
    }, [dispatchWithPromise]);
    return [state, outerDispatch];
  };
  return useEnhancedReducer;
}

const compose = (fns: Function[]) => (initial: any) =>
  fns.reduceRight((v, f) => f(v), initial);
