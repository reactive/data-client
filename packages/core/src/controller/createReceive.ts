import type { ReceiveAction } from '@rest-hooks/core/types';
import { RECEIVE_TYPE } from '@rest-hooks/core/actionTypes';
import type { EndpointInterface, ResolveType } from '@rest-hooks/endpoint';
import { EndpointUpdateFunction } from '@rest-hooks/core/controller/types';

export default function createReceive<
  E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
  },
>(
  endpoint: E,
  options: {
    args: readonly [...Parameters<E>];
    response: Error;
    fetchedAt?: number;
    error: true;
  },
): ReceiveAction;

export default function createReceive<
  E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
  },
>(
  endpoint: E,
  options: {
    args: readonly [...Parameters<E>];
    response: ResolveType<E>;
    fetchedAt?: number;
    error?: false;
  },
): ReceiveAction;

export default function createReceive<
  E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
  },
>(
  endpoint: E,
  {
    args,
    fetchedAt = 0,
    response,
    error = false,
  }: {
    args: readonly [...Parameters<E>];
    response: any;
    fetchedAt?: number;
    error?: boolean;
  },
): ReceiveAction {
  const expiryLength: number = error
    ? endpoint.errorExpiryLength ?? 1000
    : endpoint.dataExpiryLength ?? 60000;
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && expiryLength < 0) {
    throw new Error('Negative expiry length are not allowed.');
  }
  const now = Date.now();
  const meta: ReceiveAction['meta'] = {
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

  const action: ReceiveAction = {
    type: RECEIVE_TYPE,
    payload: response,
    endpoint: endpoint,
    meta,
  };
  if (error) (action as any).error = true;
  return action;
}

/** Future action shape
{
  type: RECEIVE_TYPE,
  endpoint,
  payload,
  meta: {
    args,
    date,
    expiresAt,
    fetchedAt,
  },
  error?: true,
} */
