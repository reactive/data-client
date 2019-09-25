import { useMemo } from 'react';

import { ReadShape, Schema } from '~/resource';
import useFetcher from './useFetcher';
import useMeta from './useMeta';

/** Returns whether the data at this url is fresh or stale */
function useExpiresAt<
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void,
  S extends Schema
>(fetchShape: ReadShape<S, Params, Body>, params: Params | null): number {
  const meta = useMeta(fetchShape, params);
  if (!meta) {
    return 0;
  }
  return meta.expiresAt;
}

/** Request a resource if it is not in cache. */
export default function useRetrieve<
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void,
  S extends Schema
>(fetchShape: ReadShape<S, Params, Body>, params: Params | null, body?: Body) {
  const fetch = useFetcher(fetchShape, true);
  const expiresAt = useExpiresAt(fetchShape, params);

  // TODO: figure out how to express that body is optional in FetchShape as we don't need to cast here
  return useMemo(() => {
    if (Date.now() <= expiresAt) return;
    // null params mean don't do anything
    if (!params) return;
    return fetch(body as Body, params);
    // we don't care to re-request on body (should we?)
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, fetch, params && fetchShape.getFetchKey(params)]);
}
