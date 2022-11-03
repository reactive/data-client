/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {
  Denormalize,
  DenormalizeNullable,
  ErrorTypes,
  EndpointInterface,
  FetchFunction,
  Schema,
  ResolveType,
} from '@rest-hooks/normalizr';
import { ExpiryStatus } from '@rest-hooks/normalizr';
import { useMemo } from 'react';

import useController from '../hooks/useController.js';
import useCacheState from './useCacheState.js';

type CondNull<P, A, B> = P extends null ? A : B;

type StatefulReturn<S extends Schema | undefined, P> = CondNull<
  P,
  {
    data: DenormalizeNullable<S>;
    loading: false;
    error: undefined;
  },
  | {
      data: Denormalize<S>;
      loading: false;
      error: undefined;
    }
  | { data: DenormalizeNullable<S>; loading: true; error: undefined }
  | { data: DenormalizeNullable<S>; loading: false; error: ErrorTypes }
>;

/**
 * Use async date with { data, loading, error } (DLE)
 * @see https://resthooks.io/docs/guides/no-suspense
 */
export default function useDLE<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(
  endpoint: E,
  ...args: Args
): E['schema'] extends undefined
  ? {
      data: E extends (...args: any) => any ? ResolveType<E> | undefined : any;
      loading: boolean;
      error: ErrorTypes | undefined;
    }
  : StatefulReturn<E['schema'], Args[0]> {
  const state = useCacheState();
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const cacheResults = args[0] !== null && state.results[key];

  // Compute denormalized value
  // eslint-disable-next-line prefer-const
  let { data, expiryStatus, expiresAt } = useMemo(() => {
    // @ts-ignore
    return controller.getResponse(endpoint, ...args, state) as {
      data: DenormalizeNullable<E['schema']> | undefined;
      expiryStatus: ExpiryStatus;
      expiresAt: number;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cacheResults,
    state.indexes,
    state.entities,
    state.entityMeta,
    state.meta,
    key,
  ]);

  // @ts-ignore
  const error = controller.getError(endpoint, ...args, state);

  // If we are hard invalid we must fetch regardless of triggering or staleness
  const forceFetch = expiryStatus === ExpiryStatus.Invalid;

  const maybePromise = useMemo(() => {
    // null params mean don't do anything
    if ((Date.now() <= expiresAt && !forceFetch) || !key) return;

    return controller.fetch(endpoint, ...(args as any)).catch(() => {});
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, controller, key, forceFetch, state.lastReset]);

  // fully "valid" data will not suspend/loading even if it is not fresh
  const loading = expiryStatus !== ExpiryStatus.Valid && !!maybePromise;

  data = useMemo(() => {
    // if useSuspense() would suspend, don't include entities from cache
    if (loading) {
      if (!endpoint.schema) return undefined;
      // @ts-ignore
      return controller.getResponse(endpoint, ...args, {
        ...state,
        entities: {},
      }).data as any;
    }
    return data;
    // key substitutes args + endpoint
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, controller, data, loading, state]);

  return {
    data,
    loading,
    error,
  } as any;
}
