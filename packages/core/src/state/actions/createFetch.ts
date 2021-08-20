import { FetchAction } from '@rest-hooks/core/types';
import { FETCH_TYPE } from '@rest-hooks/core/actionTypes';
import { Schema } from '@rest-hooks/endpoint';
import {
  FetchShape,
  SchemaFromShape,
  ParamsFromShape,
  BodyFromShape,
  OptimisticUpdateParams,
} from '@rest-hooks/core/endpoint/index';

interface Options<
  Shape extends FetchShape<
    Schema | undefined,
    Readonly<object>,
    Readonly<object | string> | void
  >,
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
  >,
>(
  fetchShape: Shape & {
    update?: (...args: any) => Record<string, (...args: any) => any>;
  },
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
    args: [params, body],
    key,
    throttle,
    options,
    resolve,
    reject,
    promise,
    createdAt: new Date(),
  };

  if (fetchShape.update) {
    meta.update = fetchShape.update;
  }

  // for simplicity we simply override if updateParams are defined - usage together is silly to support as we are migrating
  if (updateParams) {
    meta.update = (newresult: any): Record<string, (...args: any) => any> => {
      const updateMap: any = {};
      updateParams.forEach(([toShape, toParams, updateFn]) => {
        updateMap[toShape.getFetchKey(toParams)] = (existing: any) =>
          updateFn(newresult, existing);
      });
      return updateMap;
    };
  }

  if (options?.optimisticUpdate) {
    meta.optimisticResponse = options.optimisticUpdate(params, body);
  }

  return {
    type: FETCH_TYPE,
    payload: () => fetchShape.fetch(params, body),
    meta,
  };
}
