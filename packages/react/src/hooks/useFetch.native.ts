import { DenormalizeNullable, ExpiryStatus, NI } from '@data-client/core';
import {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
} from '@data-client/core';
import { useMemo } from 'react';
import { InteractionManager } from 'react-native';

import useCacheState from './useCacheState.js';
import useController from './useController.js';
import useFocusEffect from './useFocusEffect.native.js';

/**
 * Request a resource if it is not in cache.
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
): E['schema'] extends undefined | null ? ReturnType<E>
: Promise<Denormalize<E['schema']>>;

export default function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>] | readonly [null]
): E['schema'] extends undefined | null ? ReturnType<E> | undefined
: Promise<DenormalizeNullable<E['schema']>>;

export default function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>] | readonly [null]
): Promise<any> | undefined {
  const state = useCacheState();
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const cacheResults = key && state.endpoints[key];
  const meta = state.meta[key];

  // Compute denormalized value
  const { expiryStatus, expiresAt } = useMemo(() => {
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
    // if args is [null], we won't get to this line
    return controller.fetch(endpoint, ...(args as Parameters<E>));
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, key, forceFetch, state.lastReset]);

  useFocusEffect(() => {
    // revalidating non-suspending data is low priority, so make sure it doesn't stutter animations
    const task = InteractionManager.runAfterInteractions(() => {
      if (Date.now() > expiresAt && key) {
        controller.fetch(endpoint, ...(args as Parameters<E>));
      }
    });

    return () => task.cancel();
  }, []);

  return maybePromise;
}
