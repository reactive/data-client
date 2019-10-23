import { useRef, useCallback, useEffect } from 'react';

type PromiseHolder = { promise: Promise<void>; resolve: () => void };

export default function usePromisifiedDispatch<
  R extends React.Reducer<any, any>
>(
  dispatch: React.Dispatch<React.ReducerAction<R>>,
  state: React.ReducerState<R>,
) {
  const dispatchPromiseRef = useRef<null | PromiseHolder>(null);
  useEffect(() => {
    if (dispatchPromiseRef.current) {
      dispatchPromiseRef.current.resolve();
      dispatchPromiseRef.current = null;
    }
  }, [state]);

  return useCallback(
    (action: React.ReducerAction<R>) => {
      if (!dispatchPromiseRef.current) {
        dispatchPromiseRef.current = NewPromiseHolder();
      }
      // we use the promise before dispatch so we know it will be resolved
      // however that can also make the ref clear, so we need to make sure we have to promise before
      // dispatching so we can return it even if the ref changes.
      const promise = dispatchPromiseRef.current.promise;
      dispatch(action);
      return promise;
    },
    [dispatch],
  );
}

function NewPromiseHolder(): PromiseHolder {
  // any so we can build it
  const promiseHolder: any = {};
  promiseHolder.promise = new Promise(resolve => {
    promiseHolder.resolve = resolve;
  });
  return promiseHolder;
}
