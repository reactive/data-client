import {
  useRetrieve,
  useError,
  Schema,
  ReadShape,
  useDenormalized,
  __INTERNAL__,
} from 'rest-hooks';

import { useContext } from 'react';

/** Ensure a resource is available; loading and error returned explicitly. */
export function useStatefulResource<
  Params extends Readonly<object>,
  S extends Schema
>(fetchShape: ReadShape<S, Params>, params: Params | null) {
  const maybePromise = useRetrieve(fetchShape, params);
  const state = useContext(__INTERNAL__.StateContext);
  const expired = !!maybePromise && typeof maybePromise.then === 'function';
  const [denormalized, ready] = useDenormalized(
    fetchShape,
    params,
    state,
    expired,
  );

  const loading = !__INTERNAL__.hasUsableData(ready, fetchShape) && expired;
  const error = useError(fetchShape, params, ready);

  return {
    data: denormalized,
    loading,
    error,
  };
}
