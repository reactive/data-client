import { ReadShape, ParamsFromShape } from '../../endpoint/index.js';
import useMeta from './useMeta.js';

/** Returns whether the data at this url is fresh or stale
 * @deprecated use https://resthooks.io/docs/api/Controller#getResponse
 */
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
