import { FetchShape } from '@rest-hooks/core/endpoint';

/** If the invalidIfStale option is set we suspend if resource has expired */
export default function hasUsableData(
  fetchShape: Pick<FetchShape<any>, 'options'>,
  cacheReady: boolean,
  deleted: boolean,
  invalidated?: boolean,
) {
  return (
    !deleted &&
    !(fetchShape.options && fetchShape.options.invalidIfStale) &&
    cacheReady &&
    !invalidated
  );
}
