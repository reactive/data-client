import { OPTIMISTIC_TYPE } from '@rest-hooks/core/actionTypes';
import type { EndpointInterface } from '@rest-hooks/endpoint';
import { EndpointUpdateFunction } from '@rest-hooks/core/controller/types';

import { OptimisticAction } from '..';

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
): OptimisticAction {
  const expiryLength: number = endpoint.dataExpiryLength ?? 60000;
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && expiryLength < 0) {
    throw new Error('Negative expiry length are not allowed.');
  }
  const now = Date.now();
  const meta: OptimisticAction['meta'] = {
    schema: endpoint.schema,
    key: endpoint.key(...args),
    args,
    fetchedAt,
    date: now,
    expiresAt: now + expiryLength,
    errorPolicy: endpoint.errorPolicy,
  };
  meta.update = endpoint.update;

  const action: OptimisticAction = {
    type: OPTIMISTIC_TYPE,
    endpoint: endpoint,
    meta,
  };
  return action;
}

/** Future action shape
{
  type: OPTIMISTIC_TYPE,
  endpoint,
  meta: {
    args,
    date,
    expiresAt,
  },
  error?: true,
} */
