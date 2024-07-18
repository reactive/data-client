import type { EndpointInterface, NI } from '@data-client/normalizr';

import { FETCH_TYPE } from '../../actionTypes.js';
import type { FetchAction, FetchMeta } from '../../types.js';
import { EndpointUpdateFunction } from '../types.js';

/**
 * Requesting a fetch to begin
 */
export function createFetch<
  E extends EndpointInterface & { update?: EndpointUpdateFunction<E> },
>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): FetchAction<E> {
  let resolve: (value?: any | PromiseLike<any>) => void = 0 as any;
  let reject: (reason?: any) => void = 0 as any;
  const promise = new Promise<any>((a, b) => {
    [resolve, reject] = [a, b];
  });
  const meta: FetchMeta = {
    fetchedAt: Date.now(),
    resolve,
    reject,
    promise,
  };

  return {
    type: FETCH_TYPE,
    key: endpoint.key(...args),
    endpoint,
    args,
    meta,
  };
}
