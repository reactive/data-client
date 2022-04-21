import { FetchShape } from '../../endpoint/index.js';

/** @deprecated use https://resthooks.io/docs/api/Controller#getResponse */
export default function hasUsableData(
  fetchShape: Pick<FetchShape<any>, 'options'>,
  cacheReady: boolean,
  deleted: boolean,
  invalidated?: boolean,
) {
  return (
    !deleted &&
    !fetchShape.options?.invalidIfStale &&
    cacheReady &&
    !invalidated
  );
}
