import { useContext, useRef, useCallback } from 'react';

import { FetchAction, UpdateFunction, ReceiveTypes } from '~/types';
import {
  RECEIVE_DELETE_TYPE,
  RECEIVE_MUTATE_TYPE,
  RECEIVE_TYPE,
  FETCH_TYPE,
} from '~/actionTypes';
import {
  FetchShape,
  DeleteShape,
  Schema,
  isDeleteShape,
  SchemaFromShape,
  ParamsFromShape,
  BodyFromShape,
} from '~/resource';
import { DispatchContext } from '~/react-integration/context';

const SHAPE_TYPE_TO_RESPONSE_TYPE: Record<
  FetchShape<any, any, any>['type'],
  ReceiveTypes
> = {
  read: RECEIVE_TYPE,
  mutate: RECEIVE_MUTATE_TYPE,
  delete: RECEIVE_DELETE_TYPE,
};

type OptimisticUpdateParams<
  SourceSchema extends Schema,
  DestShape extends FetchShape<any, any, any>
> = [
  DestShape,
  ParamsFromShape<DestShape>,
  UpdateFunction<SourceSchema, SchemaFromShape<DestShape>>,
];

/** Build an imperative dispatcher to issue network requests. */
export default function useFetcher<
  Shape extends FetchShape<
    Schema,
    Readonly<object>,
    Readonly<object | string> | void
  >
>(
  fetchShape: Shape,
  throttle = false,
): Shape extends DeleteShape<any, any, any>
  ? (params: ParamsFromShape<Shape>, body: BodyFromShape<Shape>) => Promise<any>
  : <
      UpdateParams extends OptimisticUpdateParams<
        SchemaFromShape<Shape>,
        FetchShape<any, any, any>
      >[]
    >(
      params: ParamsFromShape<Shape>,
      body: BodyFromShape<Shape>,
      updateParams?: UpdateParams | undefined,
    ) => Promise<any> {
  const dispatch = useContext(DispatchContext);

  // we just want the current values when we dispatch, so
  // box the shape in a ref to make react-hooks/exhaustive-deps happy
  const shapeRef = useRef(fetchShape);
  shapeRef.current = fetchShape;

  const fetchDispatcher = useCallback(
    (
      params: ParamsFromShape<Shape>,
      body: BodyFromShape<Shape>,
      updateParams?:
        | OptimisticUpdateParams<
            SchemaFromShape<Shape>,
            FetchShape<any, any, any>
          >[]
        | undefined,
    ) => {
      const { fetch, schema, type, getFetchKey, options } = shapeRef.current;
      const responseType = SHAPE_TYPE_TO_RESPONSE_TYPE[type];

      const key = getFetchKey(params);
      /* istanbul ignore next */
      if (process.env.NODE_ENV !== 'production') {
        if (
          isDeleteShape(shapeRef.current) &&
          typeof shapeRef.current.schema.getId !== 'function'
        ) {
          throw new Error(
            `Request for '${key}' of type delete used, but schema has no pk().
Schema must be an entity.
Schema: ${JSON.stringify(shapeRef.current.schema, null, 2)}

Note: Network response is ignored for delete type.`,
          );
        }
      }
      const identifier = isDeleteShape(shapeRef.current)
        ? shapeRef.current.schema.getId(params)
        : key;
      let resolve: (value?: any | PromiseLike<any>) => void = 0 as any;
      let reject: (reason?: any) => void = 0 as any;
      const promise = new Promise<any>((a, b) => {
        [resolve, reject] = [a, b];
      });
      const meta: FetchAction['meta'] = {
        schema,
        responseType,
        url: identifier,
        throttle,
        options,
        resolve,
        reject,
      };

      if (updateParams) {
        meta.updaters = updateParams.reduce(
          (accumulator: object, [toShape, toParams, updateFn]) => ({
            [toShape.getFetchKey(toParams)]: updateFn,
            ...accumulator,
          }),
          {},
        );
      }

      dispatch({
        type: FETCH_TYPE,
        payload: () => fetch(params, body),
        meta,
      });
      return promise;
    },
    [dispatch, throttle],
  );
  // any is due to the ternary that we don't want to deal with in our implementation
  return fetchDispatcher as any;
}
