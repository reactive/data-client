import { useContext, useRef, useCallback } from 'react';

import { FetchShape, Schema, isDeleteShape } from '~/resource';
import { DispatchContext } from '~/react-integration/context';

const SHAPE_TYPE_TO_RESPONSE_TYPE: Record<
  FetchShape<any, any, any>['type'],
  'rest-hooks/receive' | 'rest-hooks/rpc' | 'rest-hooks/purge'
> = {
  read: 'rest-hooks/receive',
  mutate: 'rest-hooks/rpc',
  delete: 'rest-hooks/purge',
};

/** Build an imperative dispatcher to issue network requests. */
export default function useFetcher<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(fetchShape: FetchShape<S, Params, Body>, throttle = false) {
  const dispatch = useContext(DispatchContext);

  // we just want the current values when we dispatch, so
  // box the shape in a ref to make react-hooks/exhaustive-deps happy
  const shapeRef = useRef(fetchShape);
  shapeRef.current = fetchShape;

  const fetchDispatcher = useCallback(
    (body: Body, params: Params) => {
      const { fetch, schema, type, getUrl, options } = shapeRef.current;
      const responseType = SHAPE_TYPE_TO_RESPONSE_TYPE[type];

      const url = getUrl(params);
      const identifier = isDeleteShape(shapeRef.current)
        ? (schema as any).getId(params)
        : url;
      let resolve: (value?: any | PromiseLike<any>) => void = () => undefined;
      let reject: (reason?: any) => void = () => undefined;
      const promise = new Promise<any>((a, b) => {
        [resolve, reject] = [a, b];
      });

      dispatch({
        type: 'rest-hooks/fetch',
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
    [dispatch, throttle],
  );
  return fetchDispatcher;
}
