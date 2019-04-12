import { ReadShape, Schema, RequestResource } from '../../resource';
import useMeta from './useMeta';

/** Access a resource or error if failed to get it */
export default function useError<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(
  selectShape: ReadShape<S, Params, Body>,
  params: Params | null,
  resource: RequestResource<typeof selectShape> | null,
) {
  const meta = useMeta(selectShape, params);
  if (!resource) {
    if (!meta) return;
    if (!meta.error) {
      // this means we probably deleted the entity found in this result
      const err: any = new Error(
        `Resource not found ${params ? selectShape.getUrl(params) : ''}`,
      );
      err.status = 404;
      throw err;
    } else {
      throw meta.error;
    }
  }
}
