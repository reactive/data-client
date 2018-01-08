import { useMemo } from 'react';

import { RequestShape, ParamArg, PayloadArg } from '../../resource';
import useDispatch from './useDispatch';
import useMeta from './useMeta';

/** Returns whether the data at this url is fresh or stale */
function useIsStale<
S extends RequestShape<P1, P2>,
P1 extends object,
P2 extends object
>(selectShape: S, params: ParamArg<S> | null): boolean {
  const meta = useMeta(selectShape, params);
  if (!meta) {
    return true;
  }
  return Date.now() > meta.expiresAt;
}

/** Request a resource if it is not in cache. */
export default function useFetch<
S extends RequestShape<P1, P2>,
P1 extends object,
P2 extends object
>(selectShape: S, params: ParamArg<S> | null, body?: PayloadArg<S>) {
  const fetch = useDispatch(selectShape, true);
  const dataStale = useIsStale(selectShape, params);

  // TODO: figure out how to express that body is optional in RequestShape as we don't need to cast here
  return useMemo(() => {
    if (!dataStale) return;
    // null params mean don't do anything
    if (!params) return;
    return fetch(body as PayloadArg<S>, params);
  }, [dataStale, params && selectShape.getUrl(params)]);
}
