/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ExpiryStatus } from '@data-client/core';
import type {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
  DenormalizeNullable,
  ResolveType,
  NI,
} from '@data-client/core';
import { useMemo } from 'react';
import { InteractionManager } from 'react-native';

import useCacheState from './useCacheState.js';
import useController from './useController.js';
import useFocusEffect from './useFocusEffect.native.js';

/**
 * Ensure an endpoint is available.
 * Suspends until it is.
 *
 * `useSuspense` guarantees referential equality globally.
 * @see https://dataclient.io/docs/api/useSuspense
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
export default function useSuspense<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>]
): E['schema'] extends undefined | null ? ResolveType<E>
: Denormalize<E['schema']>;

export default function useSuspense<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>] | readonly [null]
): E['schema'] extends undefined | null ? ResolveType<E> | undefined
: DenormalizeNullable<E['schema']>;

export default function useSuspense<
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

  const error = controller.getError(endpoint, ...args, state);

  // If we are hard invalid we must fetch regardless of triggering or staleness
  const forceFetch = expiryStatus === ExpiryStatus.Invalid;

  const maybePromise = useMemo(() => {
    // null params mean don't do anything
    if ((Date.now() <= expiresAt && !forceFetch) || !key) return;

    return (
      controller
        // if args is [null], we won't get to this line
        .fetch(endpoint, ...(args as [...Parameters<E>]))
        .catch(() => {})
    );
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, controller, key, forceFetch, state.lastReset]);

  // fully "valid" data will not suspend even if it is not fresh
  if (expiryStatus !== ExpiryStatus.Valid && maybePromise) {
    throw maybePromise;
  }

  if (error) throw error;

  useFocusEffect(() => {
    // revalidating non-suspending data is low priority, so make sure it doesn't stutter animations
    const task = InteractionManager.runAfterInteractions(() => {
      if (Date.now() > expiresAt && key) {
        controller.fetch(endpoint, ...(args as readonly [...Parameters<E>]));
      }
    });

    return () => task.cancel();
  }, []);

  return data;
}
