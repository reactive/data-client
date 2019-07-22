import { useMemo } from 'react';

import { ReadShape, Schema } from '~/resource';
import useFetcher from './useFetcher';

/** Request a resource if it is not in cache. */
export default function useRetrieve<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(fetchShape: ReadShape<S, Params, Body>, params: Params | null, body?: Body) {
  const fetch = useFetcher(fetchShape, true, true);

  // TODO: figure out how to express that body is optional in FetchShape as we don't need to cast here
  return useMemo(() => {
    // null params mean don't do anything
    if (!params) return;
    return fetch(body as Body, params);
    // we don't care to re-request on body (should we?)
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch, params && fetchShape.getFetchKey(params)]);
}
