/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  DenormalizeNullable,
  ExpiryStatus,
  ResolveType,
} from '@data-client/core';
import type {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
} from '@data-client/core';
import { useMemo } from 'react';
import { InteractionManager } from 'react-native';

import { SuspenseReturn } from './types.js';
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
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args): SuspenseReturn<E, Args> {
  const state = useCacheState();
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const cacheResults = key && state.endpoints[key];
  const meta = state.meta[key];

  // Compute denormalized value
  const { data, expiryStatus, expiresAt } = useMemo(() => {
    // @ts-ignore
    return controller.getResponse(endpoint, ...args, state) as {
      data: Denormalize<E['schema']>;
      expiryStatus: ExpiryStatus;
      expiresAt: number;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cacheResults,
    state.indexes,
    state.entities,
    state.entityMeta,
    meta,
    key,
  ]);

  // @ts-ignore
  const error = controller.getError(endpoint, ...args, state);

  // If we are hard invalid we must fetch regardless of triggering or staleness
  const forceFetch = expiryStatus === ExpiryStatus.Invalid;

  const maybePromise = useMemo(() => {
    // null params mean don't do anything
    if ((Date.now() <= expiresAt && !forceFetch) || !key) return;

    return controller.fetch(endpoint, ...(args as readonly [...Parameters<E>]));
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

  return data as any;
}
