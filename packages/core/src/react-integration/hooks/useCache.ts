import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint/index';
import { DenormalizeNullable } from '@rest-hooks/endpoint';
import { useDenormalized } from '@rest-hooks/core/state/selectors/index';
import { useContext, useMemo } from 'react';
import { StateContext } from '@rest-hooks/core/react-integration/context';
import { denormalize, inferResults } from '@rest-hooks/normalizr';
import { ExpiryStatus } from '@rest-hooks/core/controller/Expiry';

/**
 * Access a resource if it is available.
 *
 * `useCache` guarantees referential equality globally.
 * @see https://resthooks.io/docs/api/useCache
 */
export default function useCache<
  Shape extends Pick<ReadShape<any, any>, 'getFetchKey' | 'schema' | 'options'>,
>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape> | null,
): DenormalizeNullable<Shape['schema']> {
  const state = useContext(StateContext);

  const { data, expiryStatus, expiresAt } = useDenormalized(
    fetchShape,
    params,
    state,
  );
  const forceFetch = expiryStatus === ExpiryStatus.Invalid;

  /*********** This block is to ensure results are only filled when they would not suspend **************/
  // This computation reflects the behavior of useResource/useRetrive
  // It only changes the value when expiry or params change.
  // This way, random unrelated re-renders don't cause the concept of expiry
  // to change
  const expired = useMemo(() => {
    if ((Date.now() <= expiresAt && !forceFetch) || !params) return false;
    return true;
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, params && fetchShape.getFetchKey(params), forceFetch]);

  // if useResource() would suspend, don't include entities from cache
  if (expiryStatus !== ExpiryStatus.Valid && expired) {
    return denormalize(
      inferResults(fetchShape.schema, [params], state.indexes),
      fetchShape.schema,
      {},
    )[0];
  }
  /*********************** end block *****************************/

  return data;
}
