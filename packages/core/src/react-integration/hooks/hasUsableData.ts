import { FetchShape } from '@rest-hooks/core/endpoint';
import { EndpointInterface } from 'packages/endpoint/lib';

/** If the invalidIfStale option is set we suspend if resource has expired */
export default function hasUsableData(
  fetchShape: Pick<EndpointInterface, 'invalidIfStale'>,
  cacheReady: boolean,
  deleted: boolean,
  invalidated?: boolean,
) {
  return !deleted && !fetchShape.invalidIfStale && cacheReady && !invalidated;
}
