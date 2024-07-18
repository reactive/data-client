import type { EndpointInterface, ResolveType } from '@data-client/normalizr';

import { createMeta } from './createMeta.js';
import { SET_RESPONSE_TYPE } from '../../actionTypes.js';
import type { SetResponseAction } from '../../types.js';
import ensurePojo from '../ensurePojo.js';
import { EndpointUpdateFunction } from '../types.js';

export function createSetResponse<
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
): SetResponseAction<E>;

export function createSetResponse<
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
): SetResponseAction<E>;

export function createSetResponse<
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
): SetResponseAction<E> {
  const expiryLength: number =
    error ?
      (endpoint.errorExpiryLength ?? 1000)
    : (endpoint.dataExpiryLength ?? 60000);
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && expiryLength < 0) {
    throw new Error('Negative expiry length are not allowed.');
  }

  return {
    type: SET_RESPONSE_TYPE,
    key: endpoint.key(...args),
    response,
    endpoint,
    args: args.map(ensurePojo),
    meta: createMeta(expiryLength, fetchedAt),
    error,
  };
}
