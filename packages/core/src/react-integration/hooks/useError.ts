import { ReadShape } from '@rest-hooks/core/endpoint';
import { Schema } from '@rest-hooks/normalizr';

import useMeta from './useMeta';

type UseErrorReturn<P> = P extends null ? undefined : Error;

/** Access a resource or error if failed to get it */
export default function useError<
  Params extends Readonly<object>,
  S extends Schema
>(
  fetchShape: ReadShape<S, Params>,
  params: Params | null,
  cacheReady: boolean,
): UseErrorReturn<typeof params> {
  const meta = useMeta(fetchShape, params);
  if (!params) return;
  if (!cacheReady) {
    if (!meta) return;
    if (!meta.error && !meta.invalidated) {
      // this means the response is missing an expected entity
      const err: any = new Error(
        `Resource not found in cache ${fetchShape.getFetchKey(
          params,
        )}. Likely due to malformed response`,
      );
      err.status = 400;
      return err;
    } else {
      return meta.error as any;
    }
  }
}
