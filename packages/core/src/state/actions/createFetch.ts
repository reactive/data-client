import { FetchAction } from '@rest-hooks/core/types';
import { FETCH_TYPE } from '@rest-hooks/core/actionTypes';
import {
  EndpointInterface,
  FetchFunction,
  OptimisticUpdateParams,
} from '@rest-hooks/endpoint';

interface Options<E extends EndpointInterface<FetchFunction, any, any>> {
  params: Parameters<E>[0];
  body?: Parameters<E>[1];
  throttle: boolean;
  updateParams?:
    | OptimisticUpdateParams<
        E['schema'],
        EndpointInterface<FetchFunction, any, any>
      >[]
    | undefined;
}

/** Requesting a fetch to begin
 *
 * @param endpoint
 * @param options { params, body, throttle, updateParams }
 */
export default function createFetch<
  E extends EndpointInterface<FetchFunction, any, any>
>(
  endpoint: E,
  { params, body, throttle, updateParams }: Options<E>,
): FetchAction<E> {
  let resolve: (value?: any | PromiseLike<any>) => void = 0 as any;
  let reject: (reason?: any) => void = 0 as any;
  const promise = new Promise<any>((a, b) => {
    [resolve, reject] = [a, b];
  });
  const meta: FetchAction['meta'] = {
    throttle,
    resolve,
    reject,
    promise,
  };

  if (updateParams) {
    meta.updaters = updateParams.reduce(
      (accumulator: object, [toShape, toParams, updateFn]) => ({
        [toShape.key(toParams)]: updateFn,
        ...accumulator,
      }),
      {},
    );
  }

  if (endpoint.optimisticUpdate) {
    meta.optimisticResponse = endpoint.optimisticUpdate(params, body);
  }

  return {
    type: FETCH_TYPE,
    endpoint,
    args: [params, body] as any,
    meta,
  };
}
