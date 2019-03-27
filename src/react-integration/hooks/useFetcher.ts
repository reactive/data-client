import { useContext, useCallback } from 'react';

import { RequestShape, Schema, isDeleteShape } from '../../resource';
import { DispatchContext } from '../context';

const SHAPE_TYPE_TO_RESPONSE_TYPE: Record<
  RequestShape<any, any, any>['type'],
  'receive' | 'rpc' | 'purge'
> = {
  read: 'receive',
  mutate: 'rpc',
  delete: 'purge',
};

/** Build an imperative dispatcher to issue network requests. */
export default function useFetcher<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(requestShape: RequestShape<S, Params, Body>, throttle = false) {
  const { fetch, schema, type, getUrl, options } = requestShape;
  const responseType = SHAPE_TYPE_TO_RESPONSE_TYPE[type];

  const dispatch = useContext(DispatchContext);

  const fetchDispatcher = useCallback(
    (body: Body, params: Params) => {
      const url = getUrl(params);
      const identifier = isDeleteShape(requestShape)
        ? (schema as any).getId(params)
        : url;
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
          responseType,
          url: identifier,
          throttle,
          options,
          resolve,
          reject,
        },
      });
      return promise;
    },
    [fetch, schema, type, getUrl, responseType, throttle, dispatch],
  );
  return fetchDispatcher;
}
