import { ReadShape } from 'rest-hooks/resource';

import useMeta from './useMeta';

/** Returns whether the data at this url is fresh or stale */
export default function useExpiresAt<Params extends Readonly<object>>(
  fetchShape: Pick<ReadShape<any, Params>, 'getFetchKey'>,
  params: Params | null,
): number {
  const meta = useMeta(fetchShape, params);
  if (!meta) {
    return 0;
  }
  return meta.expiresAt;
}
