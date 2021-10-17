import {
  useRetrieve,
  useError,
  Schema,
  StateContext,
  ParamsFromShape,
  ReadShape,
  __INTERNAL__,
  ExpiryStatus,
  useController,
} from '@rest-hooks/core';
import type {
  Denormalize,
  DenormalizeNullable,
  ErrorTypes,
} from '@rest-hooks/core';
import { denormalize } from '@rest-hooks/normalizr';
import { useContext, useMemo } from 'react';
import shapeToEndpoint from '@rest-hooks/legacy/shapeToEndpoint';

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
  Shape extends ReadShape<any, any>,
  Params extends ParamsFromShape<Shape> | null,
>(fetchShape: Shape, params: Params): StatefulReturn<Shape['schema'], Params> {
  const state = useContext(StateContext);
  const controller = useController();

  const endpoint = useMemo(() => {
    return shapeToEndpoint(fetchShape);
    // we currently don't support shape changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = params !== null ? endpoint.key(params) : '';
  const cacheResults = params && state.results[key];

  // Compute denormalized value
  // eslint-disable-next-line prefer-const
  let { data, expiryStatus, expiresAt } = useMemo(() => {
    return controller.getResponse(endpoint, params, state) as {
      data: DenormalizeNullable<Shape['schema']>;
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

  const error = useError(fetchShape, params);

  const maybePromise: Promise<any> | undefined = useRetrieve(
    fetchShape,
    params,
    expiryStatus === ExpiryStatus.Invalid,
    expiresAt,
  );

  if (maybePromise) {
    maybePromise.catch(() => {});
  }

  const loading = expiryStatus !== ExpiryStatus.Valid && !!maybePromise;
  data = loading
    ? denormalize(
        inferResults(fetchShape.schema, [params], state.indexes),
        fetchShape.schema,
        {},
      )[0]
    : data;

  return {
    data,
    loading,
    error,
  } as any;
}
