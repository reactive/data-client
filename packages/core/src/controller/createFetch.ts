import type { EndpointInterface } from '@rest-hooks/normalizr';

import type { FetchAction } from '../types.js';
import { FETCH_TYPE } from '../actionTypes.js';
import { EndpointUpdateFunction } from './types.js';

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
    createdAt: Date.now(),
  };

  if (endpoint.update) {
    meta.update = endpoint.update;
  }

  // TODO: Remove once EOL on this deprecated piece
  /* istanbul ignore if */
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
    createdAt,
    promise,
    resolve,
    reject,
  }
} */
