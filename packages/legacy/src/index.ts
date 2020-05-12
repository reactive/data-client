import {
  useRetrieve,
  useError,
  Schema,
  ReadShape,
  useDenormalized,
  StateContext,
  hasUsableData,
} from '@rest-hooks/core';
import { useContext } from 'react';

/** Ensure a resource is available; loading and error returned explicitly. */
export function useStatefulResource<
  Params extends Readonly<object>,
  S extends Schema
>(fetchShape: ReadShape<S, Params>, params: Params | null) {
  const maybePromise = useRetrieve(fetchShape, params);
  const state = useContext(StateContext);
  const expired = !!maybePromise && typeof maybePromise.then === 'function';
  const [denormalized, ready] = useDenormalized(
    fetchShape,
    params,
    state,
    expired,
  );

  const loading = !hasUsableData(ready, fetchShape) && expired;
  const error = useError(fetchShape, params, ready);

  return {
    data: denormalized,
    loading,
    error,
  };
}
