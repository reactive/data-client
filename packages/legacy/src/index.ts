import {
  useRetrieve,
  useError,
  Schema,
  ReadShape,
  useDenormalized,
  StateContext,
  hasUsableData,
  useMeta,
  __INTERNAL__,
} from '@rest-hooks/core';
import { denormalize } from '@rest-hooks/normalizr';
import { useContext } from 'react';

const { buildInferredResults } = __INTERNAL__;

/** Ensure a resource is available; loading and error returned explicitly. */
export function useStatefulResource<
  Params extends Readonly<object>,
  S extends Schema
>(fetchShape: ReadShape<S, Params>, params: Params | null) {
  const state = useContext(StateContext);
  const [denormalized, ready, deleted] = useDenormalized(
    fetchShape,
    params,
    state,
  );
  const error = useError(fetchShape, params, ready);

  const maybePromise: Promise<any> | undefined = useRetrieve(
    fetchShape,
    params,
    deleted && !error,
  );

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
  };
}
