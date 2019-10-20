import { FetchShape, Schema } from '~/resource';

/** If the invalidIfStale option is set we suspend if resource has expired */
export default function hasUsableData<
  S extends Schema,
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void
>(
  cacheReady: boolean,
  fetchShape: Pick<FetchShape<S, Params, Body>, 'options'>,
) {
  return !(
    (fetchShape.options && fetchShape.options.invalidIfStale) ||
    !cacheReady
  );
}
