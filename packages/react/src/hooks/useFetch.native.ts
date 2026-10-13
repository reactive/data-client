import { ExpiryStatus } from '@data-client/core';
import type {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
  DenormalizeNullable,
  ResolveType,
} from '@data-client/core';
import { useEffect, useMemo } from 'react';
import { InteractionManager } from 'react-native';

import {
  UsablePromise,
  createFulfilled,
  createRejected,
} from './trackPromise.js';
import useCacheState from './useCacheState.js';
import useController from './useController.js';
import useFocusEffect from './useFocusEffect.native.js';

/**
 * Fetch an Endpoint if it is not in cache or stale.
 *
 * Return value works with [React.use()](https://react.dev/reference/react/use):
 * `use(useFetch(endpoint, args))` operates like `useSuspense(endpoint, args)`.
 * @see https://dataclient.io/docs/api/useFetch
 */
export default function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>]
): E['schema'] extends undefined | null ? UsablePromise<ResolveType<E>>
: UsablePromise<Denormalize<E['schema']>>;

export default function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>] | readonly [null]
): E['schema'] extends undefined | null ?
  UsablePromise<ResolveType<E> | undefined> | undefined
: UsablePromise<DenormalizeNullable<E['schema']>> | undefined;

export default function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>] | readonly [null]
): UsablePromise | undefined {
  const state = useCacheState();
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const cacheResults = key && state.endpoints[key];
  const meta = state.meta[key];

  // Compute denormalized value
  const { data, expiryStatus, expiresAt, countRef } = useMemo(() => {
    return controller.getResponseMeta(endpoint, ...args, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cacheResults,
    state.indexes,
    state.entities,
    state.entitiesMeta,
    meta,
    key,
  ]);

  // If we are hard invalid we must fetch regardless of triggering or staleness
  const forceFetch = expiryStatus === ExpiryStatus.Invalid;

  const maybePromise = useMemo(() => {
    // null params mean don't do anything
    if ((Date.now() <= expiresAt && !forceFetch) || !key) return;

    const p: UsablePromise = Object.assign(
      controller
        // if args is [null], we won't get to this line
        .fetch(endpoint, ...(args as Parameters<E>))
        .catch(() => {}),
      { resolved: false },
    );
    const r = () => {
      p.resolved = true;
    };
    p.then(r, r);
    return p;
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, key, forceFetch, state.lastReset]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(countRef, [data]);

  useFocusEffect(() => {
    // revalidating non-suspending data is low priority, so make sure it doesn't stutter animations
    const task = InteractionManager.runAfterInteractions(() => {
      if (Date.now() > expiresAt && key) {
        controller.fetch(endpoint, ...(args as Parameters<E>));
      }
    });

    return () => task.cancel();
  }, []);

  if (!key) return undefined;

  // fully "valid" data will not suspend even if it is not fresh
  if (expiryStatus !== ExpiryStatus.Valid && maybePromise) {
    return maybePromise;
  }

  const error = controller.getError(endpoint, ...args, state);

  if (error) return createRejected(error);

  return createFulfilled(data);
}
