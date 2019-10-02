import { useContext, useRef, useCallback } from 'react';

import { FetchShape, Schema, isDeleteShape } from '~/resource';
import { OptimisticUpdatePayload } from '~/types';
import { DispatchContext } from '~/react-integration/context';
import createUpdater from './createUpdater';

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
  Body extends Readonly<object | string> | void,
  S extends Schema
>(fetchShape: FetchShape<S, Params, Body>, throttle = false) {
  const dispatch = useContext(DispatchContext);

  // we just want the current values when we dispatch, so
  // box the shape in a ref to make react-hooks/exhaustive-deps happy
  const shapeRef = useRef(fetchShape);
  shapeRef.current = fetchShape;

  const fetchDispatcher = useCallback(
    // TODO: Type payload better
    (body: Body, params: Params, updateShapeParams?: any[]) => {
      const { fetch, schema, type, getFetchKey, options } = shapeRef.current;
      const responseType = SHAPE_TYPE_TO_RESPONSE_TYPE[type];

      const key = getFetchKey(params);
      const identifier = isDeleteShape(shapeRef.current)
        ? (schema as any).getId(params)
        : key;
      let resolve: (value?: any | PromiseLike<any>) => void = 0 as any;
      let reject: (reason?: any) => void = 0 as any;
      const promise = new Promise<any>((a, b) => {
        [resolve, reject] = [a, b];
      });

      let updaters;
      if (updateShapeParams) {
        updaters = updateShapeParams.reduce(
          (accumulator: object, [toShape, toParams, updateFn]) => ({
            [toShape.getFetchKey(toParams)]: createUpdater(
              schema,
              toShape.schema,
              updateFn,
            ),
            ...accumulator,
          }),
          {},
        );
      }

      dispatch({
        type: 'rest-hooks/fetch',
        payload: () => fetch(params, body),
        meta: {
          schema,
          updaters,
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
