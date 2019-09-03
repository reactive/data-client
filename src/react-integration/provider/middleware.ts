import { useReducer, useMemo, useRef } from 'react';
import { Middleware } from '~/types';

const compose = (fns: Function[]) => (initial: any) =>
  fns.reduceRight((v, f) => f(v), initial);

// TODO: release as own library?
/** Redux-middleware compatible integration for useReducer() */
export default function createEnhancedReducerHook(
  ...middlewares: Middleware[]
) {
  const useEnhancedReducer = <R extends React.Reducer<any, any>>(
    reducer: R,
    startingState: React.ReducerState<R>,
  ): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>] => {
    const [state, realDispatch] = useReducer(reducer, startingState);
    const store = useRef(state);
    store.current = state;

    const outerDispatch = useMemo(() => {
      let dispatch: React.Dispatch<React.ReducerAction<R>> = () => {
        throw new Error(
          `Dispatching while constructing your middleware is not allowed. ` +
            `Other middleware would not be applied to this dispatch.`,
        );
      };
      // closure here around dispatch allows us to change it after middleware is constructed
      const middlewareAPI = {
        getState: () => store.current,
        dispatch: (action: React.ReducerAction<R>) => dispatch(action),
      };
      const chain = middlewares.map(middleware => middleware(middlewareAPI));
      dispatch = compose(chain)(realDispatch);
      return dispatch;
    }, [realDispatch, store]);
    return [state, outerDispatch];
  };
  return useEnhancedReducer;
}
