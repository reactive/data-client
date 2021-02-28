import { FetchAction } from '@rest-hooks/core/types';
import { FETCH_TYPE } from '@rest-hooks/core/actionTypes';
import { Schema } from '@rest-hooks/endpoint';
import {
  FetchShape,
  SchemaFromShape,
  ParamsFromShape,
  BodyFromShape,
  OptimisticUpdateParams,
} from '@rest-hooks/core/endpoint';

interface Options<
  Shape extends FetchShape<
    Schema | undefined,
    Readonly<object>,
    Readonly<object | string> | void
  >
> {
  params: ParamsFromShape<Shape>;
  body?: BodyFromShape<Shape>;
  throttle: boolean;
  updateParams?:
    | OptimisticUpdateParams<
        SchemaFromShape<Shape>,
        FetchShape<Schema | undefined, any, any>
      >[]
    | undefined;
}

/** Requesting a fetch to begin
 *
 * @param fetchShape
 * @param param1 { params, body, throttle, updateParams }
 */
export default function createFetch<
  Shape extends FetchShape<
    Schema | undefined,
    Readonly<object>,
    Readonly<object | string> | void
  >
>(
  fetchShape: Shape,
  { params, body, throttle, updateParams }: Options<Shape>,
): FetchAction {
  const { schema, type, getFetchKey, options } = fetchShape;

  const key = getFetchKey(params);
  let resolve: (value?: any | PromiseLike<any>) => void = 0 as any;
  let reject: (reason?: any) => void = 0 as any;
  const promise = new Promise<any>((a, b) => {
    [resolve, reject] = [a, b];
  });
  const meta: FetchAction['meta'] = {
    schema,
    type,
    key,
    throttle,
    options,
    resolve,
    reject,
    promise,
    createdAt:
      process.env.NODE_ENV === 'test'
        ? new Date(0)
        : /* istanbul ignore next */ new Date(),
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
    payload: () => fetchShape.fetch(params, body),
    meta,
  };
}
