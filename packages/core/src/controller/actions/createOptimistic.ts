import type { EndpointInterface } from '@data-client/normalizr';

import { createMeta } from './createMeta.js';
import { OPTIMISTIC } from '../../actionTypes.js';
import type { OptimisticAction } from '../../types.js';
import ensurePojo from '../ensurePojo.js';
import type { EndpointUpdateFunction } from '../types.js';

export function createOptimistic<
  E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
  },
>(
  endpoint: E,
  args: readonly [...Parameters<E>],
  fetchedAt: number,
): OptimisticAction<E> {
  /* istanbul ignore next */
  if (
    process.env.NODE_ENV === 'development' &&
    (endpoint.dataExpiryLength ?? 0) < 0
  ) {
    throw new Error('Negative expiry length are not allowed.');
  }

  return {
    type: OPTIMISTIC,
    key: endpoint.key(...args),
    args: args.map(ensurePojo),
    endpoint,
    meta: createMeta(endpoint.dataExpiryLength ?? 60000, fetchedAt),
  };
}
