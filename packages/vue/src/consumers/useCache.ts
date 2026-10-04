import type {
  EndpointInterface,
  DenormalizeNullable,
  Schema,
  FetchFunction,
  ResolveType,
} from '@data-client/core';
import type { ComputedRef } from 'vue';

import type {
  MaybeRefsOrGetters,
  MaybeRefsOrGettersNullable,
} from '../types.js';
import useCacheResponse from './useCacheResponse.js';

/**
 * Read an Endpoint's response if it is ready.
 *
 * `useCache` is globally memoized.
 * @see https://dataclient.io/docs/api/useCache
 */
export default function useCache<
  E extends Pick<
    EndpointInterface<FetchFunction, Schema | undefined, undefined | boolean>,
    'key' | 'schema' | 'invalidIfStale'
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGetters<Parameters<E['key']>>
): ComputedRef<
  E['schema'] extends undefined | null ?
    E extends (...args: any) => any ?
      ResolveType<E> | undefined
    : any
  : DenormalizeNullable<E['schema']>
>;

export default function useCache<
  E extends Pick<
    EndpointInterface<FetchFunction, Schema | undefined, undefined | boolean>,
    'key' | 'schema' | 'invalidIfStale'
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E['key']>> | readonly [null]
): ComputedRef<
  E['schema'] extends undefined | null ?
    E extends (...args: any) => any ?
      ResolveType<E> | undefined
    : any
  : DenormalizeNullable<E['schema']>
>;

export default function useCache(endpoint: any, ...args: any[]): any {
  return useCacheResponse(endpoint, args).data;
}
