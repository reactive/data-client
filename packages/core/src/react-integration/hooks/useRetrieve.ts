import { useMemo, useEffect, useContext } from 'react';
import { EndpointInterface, EndpointParam } from '@rest-hooks/endpoint';

import useFetcher from './useFetcher';
import useExpiresAt from './useExpiresAt';
import { DispatchContext } from '../context';

/** Request a resource if it is not in cache. */
export default function useRetrieve<E extends EndpointInterface>(
  endpoint: E,
  params: EndpointParam<E> | null,
  triggerFetch = false,
) {
  const fetch = useFetcher(endpoint, true) as (
    params: EndpointParam<E>,
  ) => Promise<any>;
  const expiresAt = useExpiresAt(endpoint, params);

  // Clears invalidIfStale loop blocking mechanism
  const dispatch = useContext(DispatchContext);
  useEffect(() => {
    if (params && endpoint.invalidIfStale)
      dispatch({
        type: 'rest-hook/mounted',
        payload: endpoint.key(params),
      }); // set expiry
  }, [params && endpoint.key(params)]);

  return useMemo(() => {
    // null params mean don't do anything
    if ((Date.now() <= expiresAt && !triggerFetch) || !params) return;
    return fetch(params);
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, fetch, params && endpoint.key(params), triggerFetch]);
}
