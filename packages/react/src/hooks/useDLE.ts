/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {
  Denormalize,
  DenormalizeNullable,
  ErrorTypes,
  EndpointInterface,
  FetchFunction,
  Schema,
  ResolveType,
} from '@data-client/core';
import { ExpiryStatus } from '@data-client/core';
import { useMemo } from 'react';

import useCacheState from './useCacheState.js';
import useController from './useController.js';

type SchemaReturn<S extends Schema | undefined> =
  | {
      data: Denormalize<S>;
      loading: false;
      error: undefined;
    }
  | { data: DenormalizeNullable<S>; loading: true; error: undefined }
  | { data: DenormalizeNullable<S>; loading: false; error: ErrorTypes };

type AsyncReturn<E> =
  | {
      data: E extends (...args: any) => any ? ResolveType<E> : any;
      loading: false;
      error: undefined;
    }
  | { data: undefined; loading: true; error: undefined }
  | { data: undefined; loading: false; error: ErrorTypes };

/**
 * Use async date with { data, loading, error } (DLE)
 * @see https://dataclient.io/docs/api/useDLE
 */
export default function useDLE<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>]
): E['schema'] extends undefined | null ? AsyncReturn<E>
: SchemaReturn<E['schema']>;

export default function useDLE<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>] | readonly [null]
): {
  data: E['schema'] extends undefined | null ? undefined
  : DenormalizeNullable<E['schema']>;
  loading: boolean;
  error: ErrorTypes | undefined;
};

export default function useDLE<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): any {
  const state = useCacheState();
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const cacheResults = key && state.endpoints[key];
  const meta = state.meta[key];

  // Compute denormalized value
  // eslint-disable-next-line prefer-const
  let { data, expiryStatus, expiresAt } = useMemo(() => {
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

  // If we are hard invalid we must fetch regardless of triggering or staleness
  const forceFetch = expiryStatus === ExpiryStatus.Invalid;

  const maybePromise = useMemo(() => {
    // null params mean don't do anything
    if ((Date.now() <= expiresAt && !forceFetch) || !key) return;

    return controller.fetch(endpoint, ...(args as any)).catch(() => {});
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, key, forceFetch, state.lastReset]);

  // fully "valid" data will not suspend/loading even if it is not fresh
  const loading = expiryStatus !== ExpiryStatus.Valid && !!maybePromise;

  data = useMemo(() => {
    // if useSuspense() would suspend, don't include entities from cache
    if (loading) {
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
  }, [key, data, loading, cacheResults]);

  const error = controller.getError(endpoint, ...args, state);

  return {
    data,
    loading,
    error,
  };
}
