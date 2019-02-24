import { useContext, useCallback } from 'react';

import { RequestShape, Schema, isReadShape, isMutateShape } from '../../resource';
import { DispatchContext } from '../context';

/** Build an imperative dispatcher to issue network requests. */
export default function useDispatch<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
>(requestShape: RequestShape<Params, Body, S>, throttle = false) {
  const { getUrl, fetch } = requestShape;
  const schema = isMutateShape(requestShape) ? requestShape.schema : undefined;
  const mutate = !isReadShape(requestShape);

  const dispatch = useContext(DispatchContext);

  const fetchDispatcher = useCallback(
    (body: Body, params: Params) => {
      const url = requestShape.getUrl(params);
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
          mutate,
          url,
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
