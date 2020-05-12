import { FetchShape } from '@rest-hooks/core/endpoint';

/** If the invalidIfStale option is set we suspend if resource has expired */
export default function hasUsableData(
  cacheReady: boolean,
  fetchShape: Pick<FetchShape<any>, 'options'>,
) {
  return !(
    (fetchShape.options && fetchShape.options.invalidIfStale) ||
    !cacheReady
  );
}
