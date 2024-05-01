/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {
  EndpointInterface,
  DenormalizeNullable,
  Schema,
  FetchFunction,
  ResolveType,
  NI,
} from '@data-client/core';
import { ExpiryStatus } from '@data-client/core';
import { useMemo } from 'react';

import useCacheState from './useCacheState.js';
import useController from '../hooks/useController.js';

/**
 * Access a response if it is available.
 *
 * `useCache` guarantees referential equality globally.
 * @see https://dataclient.io/docs/api/useCache
 */
export default function useCache<
  E extends Pick<
    EndpointInterface<FetchFunction, Schema | undefined, undefined | boolean>,
    'key' | 'schema' | 'invalidIfStale'
  >,
>(
  endpoint: E,
  ...args: readonly [...NI<Parameters<E['key']>>] | readonly [null]
): E['schema'] extends undefined | null ?
  E extends (...args: any) => any ?
    ResolveType<E> | undefined
  : any
: DenormalizeNullable<E['schema']> {
  const state = useCacheState();
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const cacheResults = key && state.endpoints[key];
  const meta = state.meta[key];

  // Compute denormalized value
  const { data, expiryStatus, expiresAt } = useMemo(() => {
    return controller.getResponse(endpoint, ...args, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cacheResults,
    state.indexes,
    state.entities,
    state.entityMeta,
    meta,
    key,
  ]);

  const forceFetch = expiryStatus === ExpiryStatus.Invalid;

  /*********** This block is to ensure results are only filled when they would not suspend **************/
  // This computation reflects the behavior of useResource/useRetrive
  // It only changes the value when expiry or params change.
  // This way, random unrelated re-renders don't cause the concept of expiry
  // to change
  const expired = useMemo(() => {
    return !((Date.now() <= expiresAt && !forceFetch) || !key);
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, controller, key, forceFetch, state.lastReset]);

  const wouldSuspend = expiryStatus !== ExpiryStatus.Valid && expired;

  return useMemo(() => {
    // if useSuspense() would suspend, don't include entities from cache
    if (wouldSuspend) {
      if (!endpoint.schema) return undefined;
      return controller.getResponse(endpoint, ...args, {
        ...state,
        entities: {},
      }).data as any;
    }
    return data;
    // key substitutes args + endpoint
    // we only need cacheResults, as entities are not used in this case
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, controller, data, wouldSuspend, cacheResults]);
  /*********************** end block *****************************/
}
