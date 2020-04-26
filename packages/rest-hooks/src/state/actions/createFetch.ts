import { FetchAction, UpdateFunction, ReceiveTypes } from 'rest-hooks/types';
import {
  RECEIVE_DELETE_TYPE,
  RECEIVE_MUTATE_TYPE,
  RECEIVE_TYPE,
  FETCH_TYPE,
} from 'rest-hooks/actionTypes';
import {
  FetchShape,
  Schema,
  isDeleteShape,
  SchemaFromShape,
  ParamsFromShape,
  BodyFromShape,
} from 'rest-hooks/resource';

const SHAPE_TYPE_TO_RESPONSE_TYPE: Record<
  FetchShape<any, any, any>['type'],
  ReceiveTypes
> = {
  read: RECEIVE_TYPE,
  mutate: RECEIVE_MUTATE_TYPE,
  delete: RECEIVE_DELETE_TYPE,
};

export type OptimisticUpdateParams<
  SourceSchema extends Schema,
  DestShape extends FetchShape<any, any, any>
> = [
  DestShape,
  ParamsFromShape<DestShape>,
  UpdateFunction<SourceSchema, SchemaFromShape<DestShape>>,
];

export default function createFetch<
  Shape extends FetchShape<
    Schema,
    Readonly<object>,
    Readonly<object | string> | void
  >
>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape>,
  body: BodyFromShape<Shape>,
  throttle: boolean,
  updateParams?:
    | OptimisticUpdateParams<
        SchemaFromShape<Shape>,
        FetchShape<any, any, any>
      >[]
    | undefined,
): FetchAction {
  const { fetch, schema, type, getFetchKey, options } = fetchShape;
  const responseType = SHAPE_TYPE_TO_RESPONSE_TYPE[type];

  const key = getFetchKey(params);
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'production') {
    if (
      isDeleteShape(fetchShape) &&
      typeof fetchShape.schema.pk !== 'function'
    ) {
      throw new Error(
        `Request for '${key}' of type delete used, but schema has no pk().
Schema must be an entity.
Schema: ${JSON.stringify(fetchShape.schema, null, 2)}

Note: Network response is ignored for delete type.`,
      );
    }
  }
  const identifier = isDeleteShape(fetchShape)
    ? fetchShape.schema.pk(params)
    : key;
  let resolve: (value?: any | PromiseLike<any>) => void = 0 as any;
  let reject: (reason?: any) => void = 0 as any;
  const promise = new Promise<any>((a, b) => {
    [resolve, reject] = [a, b];
  });
  const meta: FetchAction['meta'] = {
    schema,
    responseType,
    key: identifier,
    throttle,
    options,
    resolve,
    reject,
    promise,
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

  if (options && options.optimisticUpdate) {
    meta.optimisticResponse = options.optimisticUpdate(params, body);
  }

  return {
    type: FETCH_TYPE,
    payload: () => fetch(params, body),
    meta,
  };
}
