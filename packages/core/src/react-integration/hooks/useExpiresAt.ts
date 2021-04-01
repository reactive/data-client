import { ReadShape } from '@rest-hooks/core/endpoint';

import useMeta from './useMeta';

/** Returns whether the data at this url is fresh or stale */
export default function useExpiresAt<Params extends Readonly<object>>(
  fetchShape: Pick<ReadShape<any, Params>, 'getFetchKey' | 'options'>,
  params: Params | null,
  entitiesExpireAt = 0,
): number {
  const meta = useMeta(fetchShape, params);

  if (!meta) {
    return entitiesExpireAt;
  }

  // Temporarily prevent infinite loops until invalidIfStale is revised
  if (
    fetchShape.options?.invalidIfStale &&
    meta.prevExpiresAt &&
    meta.expiresAt - meta.prevExpiresAt < 1000
  ) {
    return meta.expiresAt + 2000;
  }

  return meta.expiresAt;
}
