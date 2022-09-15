/* eslint-disable @typescript-eslint/ban-ts-comment */
import { StateContext, useController, ExpiryStatus } from '@rest-hooks/core';
import {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
} from '@rest-hooks/normalizr';
import { useContext, useMemo } from 'react';

/**
 * Request a resource if it is not in cache.
 * @see https://resthooks.io/docs/api/useFetch
 */
export default function useFetch<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args) {
  const state = useContext(StateContext);
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const cacheResults = args[0] !== null && state.results[key];

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
    key,
    cacheResults,
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

  return maybePromise;
}
