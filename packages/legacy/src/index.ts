import {
  useRetrieve,
  useError,
  Schema,
  useDenormalized,
  StateContext,
  hasUsableData,
  useMeta,
  ParamsFromShape,
  ReadShape,
  __INTERNAL__,
} from '@rest-hooks/core';
import type {
  Denormalize,
  DenormalizeNullable,
  ErrorTypes,
} from '@rest-hooks/core';
import { denormalize } from '@rest-hooks/normalizr';
import { useContext } from 'react';

const { buildInferredResults } = __INTERNAL__;

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

/** Ensure a resource is available; loading and error returned explicitly. */
export function useStatefulResource<
  Shape extends ReadShape<any, any>,
  Params extends ParamsFromShape<Shape> | null
>(fetchShape: Shape, params: Params): StatefulReturn<Shape['schema'], Params> {
  const state = useContext(StateContext);
  const [denormalized, ready, deleted, entitiesExpireAt] = useDenormalized(
    fetchShape,
    params,
    state,
  );
  const error = useError(fetchShape, params, ready);

  const maybePromise: Promise<any> | undefined = useRetrieve(
    fetchShape,
    params,
    deleted && !error,
    entitiesExpireAt,
  );

  if (maybePromise) {
    maybePromise.catch(() => {});
  }

  const loading =
    !hasUsableData(
      fetchShape,
      ready,
      deleted,
      useMeta(fetchShape, params)?.invalidated,
    ) && !!maybePromise;
  const data = loading
    ? denormalize(
        buildInferredResults(fetchShape.schema, params, state.indexes),
        fetchShape.schema,
        {},
      )[0]
    : denormalized;

  return {
    data,
    loading,
    error,
  } as any;
}
