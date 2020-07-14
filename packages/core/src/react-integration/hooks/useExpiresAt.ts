import { EndpointInterface } from '@rest-hooks/endpoint';

import useMeta from './useMeta';

/** Returns whether the data at this url is fresh or stale */
export default function useExpiresAt<Params extends Readonly<object>>(
  endpoint: Pick<
    EndpointInterface<(params: Params) => any>,
    'key' | 'invalidIfStale'
  >,
  params: Params | null,
): number {
  const meta = useMeta(endpoint, params);
  if (!meta) {
    return 0;
  }
  // Temporarily prevent infinite loops until invalidIfStale is revised
  if (
    endpoint.invalidIfStale &&
    meta.prevExpiresAt &&
    meta.expiresAt - meta.prevExpiresAt < 1000
  ) {
    return meta.expiresAt + 2000;
  }
  return meta.expiresAt;
}
