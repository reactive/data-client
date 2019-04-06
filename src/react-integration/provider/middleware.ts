import { useReducer, useMemo } from 'react';
import compose from 'lodash/fp/compose';
import { Middleware } from '../../types';

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

    let outerDispatch = useMemo(() => {
      let dispatch: React.Dispatch<React.ReducerAction<R>> = () => {
        throw new Error(
          `Dispatching while constructing your middleware is not allowed. ` +
            `Other middleware would not be applied to this dispatch.`,
        );
      };
      // closure here around dispatch allows us to change it after middleware is constructed
      const middlewareAPI = {
        // state is not needed in useMemo() param list since it's retrieved as function
        getState: () => state,
        dispatch: (action: React.ReducerAction<R>) => dispatch(action),
      };
      const chain = middlewares.map(middleware => middleware(middlewareAPI));
      dispatch = compose(chain)(realDispatch);
      return dispatch;
    }, [realDispatch]);
    return [state, outerDispatch];
  };
  return useEnhancedReducer;
}
