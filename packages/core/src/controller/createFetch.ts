import type { FetchAction } from '@rest-hooks/core/types';
import { FETCH_TYPE } from '@rest-hooks/core/actionTypes';
import type { EndpointInterface } from '@rest-hooks/endpoint';
import { EndpointUpdateFunction } from '@rest-hooks/core/controller/types';

/**
 * Requesting a fetch to begin
 */
export default function createFetch<
  E extends EndpointInterface & { update?: EndpointUpdateFunction<E> },
>(endpoint: E, { args }: { args: readonly [...Parameters<E>] }): FetchAction {
  const key = endpoint.key(...args);
  let resolve: (value?: any | PromiseLike<any>) => void = 0 as any;
  let reject: (reason?: any) => void = 0 as any;
  const promise = new Promise<any>((a, b) => {
    [resolve, reject] = [a, b];
  });
  const meta: FetchAction['meta'] = {
    schema: endpoint.schema,
    type: endpoint.sideEffect ? ('mutate' as const) : ('read' as const),
    args,
    key,
    throttle: !endpoint.sideEffect,
    options: endpoint,
    resolve,
    reject,
    promise,
    createdAt: new Date(),
  };

  if (endpoint.update) {
    meta.update = endpoint.update;
  }

  if (endpoint.optimisticUpdate) {
    meta.optimisticResponse = endpoint.optimisticUpdate(...args);
  }

  return {
    type: FETCH_TYPE,
    payload: () => endpoint(...args),
    meta,
    endpoint,
  };
}

/** Future action shape
{
  type: FETCH_TYPE,
  endpoint,
  meta: {
    args,
    throttle,
    createdAt,
    promise,
    resolve,
    reject,
  }
} */
