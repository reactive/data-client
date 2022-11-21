import type { EndpointInterface } from '@rest-hooks/normalizr';

import { OPTIMISTIC_TYPE } from '../actionTypes.js';
import { OptimisticAction } from '../newActions.js';
import { EndpointUpdateFunction } from './types.js';

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
  // TODO: Use correct type once we no longer need backcompat
  const meta: any = {
    args,
    fetchedAt,
    date: now,
    expiresAt: now + expiryLength,
    // For legacy support; TODO: remove
    schema: endpoint.schema,
    key: endpoint.key(...args),
  };
  // For legacy support; TODO: remove
  if (endpoint.update) meta.update = endpoint.update;
  if (endpoint.errorPolicy) meta.errorPolicy = endpoint.errorPolicy;

  const action: OptimisticAction<E> = {
    type: OPTIMISTIC_TYPE,
    endpoint,
    meta,
  };
  return action;
}
