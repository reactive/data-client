/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ExpiryStatus } from '@data-client/core';
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
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args) {
  const state = useCacheState();
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const cacheResults = key && state.endpoints[key];
  const meta = state.meta[key];

  // Compute denormalized value
  const { expiryStatus, expiresAt } = useMemo(() => {
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

  // If we are hard invalid we must fetch regardless of triggering or staleness
  const forceFetch = expiryStatus === ExpiryStatus.Invalid;

  const maybePromise = useMemo(() => {
    // null params mean don't do anything
    if ((Date.now() <= expiresAt && !forceFetch) || !key) return;
    // @ts-ignore
    return controller.fetch(endpoint, ...args);
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, controller, key, forceFetch, state.lastReset]);

  useFocusEffect(() => {
    // revalidating non-suspending data is low priority, so make sure it doesn't stutter animations
    const task = InteractionManager.runAfterInteractions(() => {
      if (Date.now() > expiresAt && key) {
        controller.fetch(endpoint, ...(args as readonly [...Parameters<E>]));
      }
    });

    return () => task.cancel();
  }, []);

  return maybePromise;
}
