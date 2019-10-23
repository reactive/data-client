import { ReadShape, Schema } from '~/resource';
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
    if (!meta.error) {
      // this means we probably deleted the entity found in this result
      const err: any = new Error(
        `Resource not found in cache ${
          params ? fetchShape.getFetchKey(params) : ''
        }`,
      );
      err.status = 404;
      return err;
    } else {
      return meta.error as any;
    }
  }
}
