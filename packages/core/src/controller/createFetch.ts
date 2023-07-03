import type { EndpointInterface } from '@data-client/normalizr';

import { EndpointUpdateFunction } from './types.js';
import { FETCH_TYPE } from '../actionTypes.js';
import type { FetchAction, FetchMeta } from '../types.js';

/**
 * Requesting a fetch to begin
 */
export default function createFetch<
  E extends EndpointInterface & { update?: EndpointUpdateFunction<E> },
>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): FetchAction<E> {
  const key = endpoint.key(...args);
  let resolve: (value?: any | PromiseLike<any>) => void = 0 as any;
  let reject: (reason?: any) => void = 0 as any;
  const promise = new Promise<any>((a, b) => {
    [resolve, reject] = [a, b];
  });
  const meta: FetchMeta = {
    args,
    key,
    throttle: !endpoint.sideEffect,
    resolve,
    reject,
    promise,
    createdAt: Date.now(),
    nm: false,
  };

  return {
    type: FETCH_TYPE,
    payload: () => endpoint(...args) as any,
    meta,
    endpoint,
  };
}
