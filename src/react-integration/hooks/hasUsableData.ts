import { FetchShape, Schema, RequestResource } from '~/resource';

/** If the invalidIfStale option is set we suspend if resource has expired */
export default function hasUsableData<
  S extends Schema,
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void
>(
  resource: RequestResource<FetchShape<S, Params, Body>> | null,
  fetchShape: Pick<FetchShape<S, Params, Body>, 'options'>,
) {
  return !(
    (fetchShape.options && fetchShape.options.invalidIfStale) ||
    !resource
  );
}
