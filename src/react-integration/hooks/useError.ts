import { ReadShape, Schema, RequestResource } from '~/resource';
import useMeta from './useMeta';

/** Access a resource or error if failed to get it */
export default function useError<
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void,
  S extends Schema
>(
  fetchShape: ReadShape<S, Params, Body>,
  params: Params | null,
  resource: RequestResource<typeof fetchShape> | null,
) {
  const meta = useMeta(fetchShape, params);
  if (!resource) {
    if (!meta) return;
    if (!meta.error) {
      // this means we probably deleted the entity found in this result
      const err: any = new Error(
        `Resource not found ${params ? fetchShape.getFetchKey(params) : ''}`,
      );
      err.status = 404;
      return err;
    } else {
      return meta.error;
    }
  }
}
