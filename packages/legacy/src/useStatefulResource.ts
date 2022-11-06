/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  StateContext,
  ParamsFromShape,
  ReadShape,
  __INTERNAL__,
  useController,
} from '@rest-hooks/core';
import type {
  Schema,
  Denormalize,
  DenormalizeNullable,
  ErrorTypes,
  EndpointInterface,
  FetchFunction,
} from '@rest-hooks/normalizr';
import { denormalize, ExpiryStatus } from '@rest-hooks/normalizr';
import { useContext, useMemo } from 'react';

import shapeToEndpoint from './endpoint/shapeToEndpoint.js';

const { inferResults } = __INTERNAL__;

type CondNull<P, A, B> = P extends null ? A : B;

type StatefulReturn<S extends Schema, P> = CondNull<
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
 * Ensure a resource is available; loading and error returned explicitly.
 * @see https://resthooks.io/docs/guides/no-suspense
 */
export default function useStatefulResource<
  E extends
    | EndpointInterface<FetchFunction, Schema | undefined, undefined>
    | ReadShape<any, any>,
  Args extends
    | (E extends (...args: any) => any
        ? readonly [...Parameters<E>]
        : readonly [ParamsFromShape<E>])
    | readonly [null],
>(endpoint: E, ...args: Args): StatefulReturn<E['schema'], Args[0]> {
  const state = useContext(StateContext);
  const controller = useController();

  const adaptedEndpoint: EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined
  > = useMemo(() => {
    return shapeToEndpoint(endpoint) as any;
    // we currently don't support shape changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = args[0] !== null ? adaptedEndpoint.key(...args) : '';
  const cacheResults = args[0] !== null && state.results[key];

  // Compute denormalized value
  // eslint-disable-next-line prefer-const
  let { data, expiryStatus, expiresAt } = useMemo(() => {
    return controller.getResponse(adaptedEndpoint, ...args, state) as {
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

  const error = controller.getError(adaptedEndpoint, ...args, state);

  // If we are hard invalid we must fetch regardless of triggering or staleness
  const forceFetch = expiryStatus === ExpiryStatus.Invalid;

  const maybePromise = useMemo(() => {
    // null params mean don't do anything
    if ((Date.now() <= expiresAt && !forceFetch) || !key) return;

    return controller.fetch(adaptedEndpoint, ...(args as any)).catch(() => {});
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, controller, key, forceFetch, state.lastReset]);

  // fully "valid" data will not suspend/loading even if it is not fresh
  const loading = expiryStatus !== ExpiryStatus.Valid && !!maybePromise;

  if (loading && adaptedEndpoint.schema)
    data = denormalize(
      inferResults(
        adaptedEndpoint.schema,
        args as any,
        state.indexes,
        state.entities,
      ),
      adaptedEndpoint.schema,
      {},
    )[0] as any;

  return {
    data,
    loading,
    error,
  } as any;
}
