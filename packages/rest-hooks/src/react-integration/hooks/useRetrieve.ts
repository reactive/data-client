import { ReadShape, ParamsFromShape } from 'rest-hooks/resource';

import { useMemo } from 'react';

import useFetcher from './useFetcher';
import useExpiresAt from './useExpiresAt';

/** Request a resource if it is not in cache. */
export default function useRetrieve<Shape extends ReadShape<any, any>>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape> | null,
) {
  const fetch = useFetcher(fetchShape, true);
  const expiresAt = useExpiresAt(fetchShape, params);

  return useMemo(() => {
    // null params mean don't do anything
    if (Date.now() <= expiresAt || !params) return;
    return fetch(params);
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, fetch, params && fetchShape.getFetchKey(params)]);
}
