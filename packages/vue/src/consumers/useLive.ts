import type {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
  ResolveType,
  DenormalizeNullable,
} from '@data-client/core';
import type { DeepReadonly, ComputedRef } from 'vue';

import useSubscription from './useSubscription.js';
import useSuspense from './useSuspense.js';
import type {
  MaybeRefsOrGetters,
  MaybeRefsOrGettersNullable,
} from '../types.js';

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
  ...args: MaybeRefsOrGetters<Parameters<E>>
): Promise<
  DeepReadonly<
    ComputedRef<
      E['schema'] extends undefined | null ? ResolveType<E>
      : Denormalize<E['schema']>
    >
  >
>;

export default function useLive<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
): Promise<
  DeepReadonly<
    ComputedRef<
      E['schema'] extends undefined | null ? ResolveType<E> | undefined
      : DenormalizeNullable<E['schema']>
    >
  >
>;

export default async function useLive(
  endpoint: any,
  ...args: any[]
): Promise<any> {
  useSubscription(endpoint, ...args);
  return useSuspense(endpoint, ...args);
}
