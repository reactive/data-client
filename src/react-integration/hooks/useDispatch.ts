import { useContext, useCallback } from 'react';

import { RequestShape, ParamArg, PayloadArg } from '../../resource';
import { DispatchContext } from '../context';

/** Build an imperative dispatcher to issue network requests. */
export default function useDispatch<
S extends RequestShape<P1, P2>,
P1 extends object,
P2 extends object
>({ fetch, schema, getUrl, mutate }: S, throttle = false) {
  const dispatch = useContext(DispatchContext);
  const fetchDispatcher = useCallback(
    (body: PayloadArg<S>, params: ParamArg<S>) => {
      const url = getUrl(params);
      let resolve: (value?: any | PromiseLike<any>) => void = () => undefined;
      let reject: (reason?: any) => void = () => undefined;
      const promise = new Promise<any>((a, b) => {
        [resolve, reject] = [a, b];
      });
      dispatch({
        type: 'fetch',
        payload: () => fetch(url, body),
        meta: {
          schema,
          url,
          mutate,
          throttle,
          resolve,
          reject,
        },
      });
      return promise;
    },
    [fetch, schema, getUrl, mutate, throttle, dispatch]
  );
  return fetchDispatcher;
}
