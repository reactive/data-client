import type { EndpointInterface } from '@data-client/normalizr';

import type { EndpointUpdateFunction } from './types.js';
import { OPTIMISTIC_TYPE } from '../actionTypes.js';
import type { OptimisticAction } from '../types.js';

export default function createOptimistic<
  E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
  },
>(
  endpoint: E,
  {
    args,
    fetchedAt,
  }: {
    args: readonly [...Parameters<E>];
    fetchedAt: number;
  },
): OptimisticAction<E> {
  const expiryLength: number = endpoint.dataExpiryLength ?? 60000;
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && expiryLength < 0) {
    throw new Error('Negative expiry length are not allowed.');
  }
  const now = Date.now();
  const meta: OptimisticAction['meta'] = {
    args,
    fetchedAt,
    date: now,
    expiresAt: now + expiryLength,
    key: endpoint.key(...args),
  };

  const action: OptimisticAction<E> = {
    type: OPTIMISTIC_TYPE,
    endpoint,
    meta,
  };
  return action;
}
