import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint';

import useMeta from './useMeta';

/** Returns whether the data at this url is fresh or stale */
export default function useExpiresAt<
  Shape extends Pick<ReadShape<any, any>, 'getFetchKey' | 'options'>,
>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape> | null,
  entitiesExpireAt = 0,
): number {
  const meta = useMeta(fetchShape, params);

  if (!meta) {
    return entitiesExpireAt;
  }

  return meta.expiresAt;
}
