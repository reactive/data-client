import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint';
import { useMemo, useEffect, useContext } from 'react';

import useFetcher from './useFetcher';
import useExpiresAt from './useExpiresAt';
import { DispatchContext } from '../context';

/** Request a resource if it is not in cache. */
export default function useRetrieve<Shape extends ReadShape<any, any>>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape> | null,
) {
  const fetch = useFetcher(fetchShape, true) as (
    params: ParamsFromShape<Shape>,
  ) => Promise<any>;
  const expiresAt = useExpiresAt(fetchShape, params);

  // Clears invalidIfStale loop blocking mechanism
  const dispatch = useContext(DispatchContext);
  useEffect(() => {
    if (params && fetchShape.options?.invalidIfStale)
      dispatch({
        type: 'rest-hook/mounted',
        payload: fetchShape.getFetchKey(params),
      }); // set expiry
  }, [params && fetchShape.getFetchKey(params)]);

  return useMemo(() => {
    // null params mean don't do anything
    if (Date.now() <= expiresAt || !params) return;
    return fetch(params);
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, fetch, params && fetchShape.getFetchKey(params)]);
}
