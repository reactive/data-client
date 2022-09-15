/* eslint-disable @typescript-eslint/ban-ts-comment */
import { StateContext, useController, ExpiryStatus } from '@rest-hooks/core';
import {
  EndpointInterface,
  Denormalize,
  DenormalizeNullable,
  Schema,
  FetchFunction,
} from '@rest-hooks/normalizr';
import { useContext, useMemo } from 'react';

/**
 * Ensure an endpoint is available.
 * Suspends until it is.
 *
 * `useSuspense` guarantees referential equality globally.
 * @see https://resthooks.io/docs/api/useSuspense
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
export default function useSuspense<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(
  endpoint: E,
  ...args: Args
): E['schema'] extends Exclude<Schema, null>
  ? CondNull<
      Args[0],
      DenormalizeNullable<E['schema']>,
      Denormalize<E['schema']>
    >
  : CondNull<Args[0], undefined, ReturnType<E>> {
  const state = useContext(StateContext);
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const cacheResults = args[0] !== null && state.results[key];

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
    key,
    cacheResults,
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

  return data as any;
}

type CondNull<P, A, B> = P extends null ? A : B;
