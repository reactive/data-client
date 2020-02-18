import { ReadShape, Schema } from 'rest-hooks/resource';
import { useMemo } from 'react';

import useFetcher from './useFetcher';
import useMeta from './useMeta';

/** Returns whether the data at this url is fresh or stale */
function useExpiresAt<Params extends Readonly<object>, S extends Schema>(
  fetchShape: ReadShape<S, Params>,
  params: Params | null,
): number {
  const meta = useMeta(fetchShape, params);
  if (!meta) {
    return 0;
  }
  return meta.expiresAt;
}

/** Request a resource if it is not in cache. */
export default function useRetrieve<
  Params extends Readonly<object>,
  S extends Schema
>(fetchShape: ReadShape<S, Params>, params: Params | null) {
  const fetch = useFetcher(fetchShape, true);
  const expiresAt = useExpiresAt(fetchShape, params);

  return useMemo(() => {
    if (Date.now() <= expiresAt) return;
    // null params mean don't do anything
    if (!params) return;
    return fetch(params);
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, fetch, params && fetchShape.getFetchKey(params)]);
}
