/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
  ResolveType,
  DenormalizeNullable,
  NI,
} from '@data-client/core';

import useSubscription from './useSubscription.js';
import useSuspense from './useSuspense.js';

/**
 * Ensure an endpoint is available. Keeps it fresh once it is.
 *
 * useSuspense() + useSubscription()
 * @see https://dataclient.io/docs/api/useLive
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
export default function useLive<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<NI<E>>]
): E['schema'] extends undefined | null ? ResolveType<E>
: Denormalize<E['schema']>;

export default function useLive<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<NI<E>>] | readonly [null]
): E['schema'] extends undefined | null ? ResolveType<E> | undefined
: DenormalizeNullable<E['schema']>;

export default function useLive<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): any {
  useSubscription(endpoint, ...args);
  return useSuspense(endpoint, ...args);
}
