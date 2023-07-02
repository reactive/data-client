import type { EndpointInterface } from '@data-client/normalizr';

import { EndpointUpdateFunction } from './types.js';
import { FETCH_TYPE } from '../actionTypes.js';
import type {
  CompatibleFetchAction,
  CompatibleFetchMeta,
} from '../compatibleActions.js';

/**
 * Requesting a fetch to begin
 */
export default function createFetch<
  E extends EndpointInterface & { update?: EndpointUpdateFunction<E> },
>(
  endpoint: E,
  { args }: { args: readonly [...Parameters<E>] },
): CompatibleFetchAction<E> {
  const key = endpoint.key(...args);
  let resolve: (value?: any | PromiseLike<any>) => void = 0 as any;
  let reject: (reason?: any) => void = 0 as any;
  const promise = new Promise<any>((a, b) => {
    [resolve, reject] = [a, b];
  });
  const meta: CompatibleFetchMeta = {
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
    payload: () => endpoint(...args) as any,
    meta,
    endpoint,
  };
}
