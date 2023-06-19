import type { EndpointInterface, ResolveType } from '@data-client/normalizr';

import { EndpointUpdateFunction } from './types.js';
import { SET_TYPE } from '../actionTypes.js';
import type {
  CompatibleReceiveAction,
  CompatibleReceiveMeta,
} from '../compatibleActions.js';

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
): CompatibleReceiveAction<E>;

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
): CompatibleReceiveAction<E>;

export default function createReceive<
  E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
  },
>(
  endpoint: E,
  {
    args,
    fetchedAt,
    response,
    error = false,
  }: {
    args: readonly [...Parameters<E>];
    response: any;
    fetchedAt?: number;
    error?: boolean;
  },
): CompatibleReceiveAction<E> {
  const expiryLength: number = error
    ? endpoint.errorExpiryLength ?? 1000
    : endpoint.dataExpiryLength ?? 60000;
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && expiryLength < 0) {
    throw new Error('Negative expiry length are not allowed.');
  }
  const now = Date.now();
  const meta: CompatibleReceiveMeta = {
    args,
    fetchedAt: fetchedAt ?? now,
    date: now,
    expiresAt: now + expiryLength,
    // For legacy support; TODO: remove
    schema: endpoint.schema,
    key: endpoint.key(...args),
  };
  // For legacy support; TODO: remove
  if (endpoint.update) meta.update = endpoint.update;
  if (endpoint.errorPolicy) meta.errorPolicy = endpoint.errorPolicy;

  const action: CompatibleReceiveAction<E> = {
    type: SET_TYPE,
    payload: response,
    endpoint: endpoint,
    meta,
  };
  if (error) (action as any).error = true;
  return action;
}
