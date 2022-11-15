export { Endpoint, Index } from '@rest-hooks/endpoint';
export type {
  EndpointExtraOptions as FetchOptions,
  EndpointParam,
  ReadEndpoint,
  MutateEndpoint,
  IndexParams,
  ArrayElement,
} from '@rest-hooks/endpoint';
export * from '@rest-hooks/react';
export type {
  FetchShape,
  ReadShape,
  MutateShape,
  DeleteShape,
  SetShapeParams,
  ParamsFromShape,
} from './endpoint/index.js';
export { default as makeCacheProvider } from '@rest-hooks/react/makeCacheProvider';

export * as __INTERNAL__ from './internal.js';
export { useDenormalized } from './selectors/index.js';
// some of these overwrite @rest-hooks/react
export {
  useCache,
  useError,
  useMeta,
  useResource,
  useRetrieve,
  useSubscription,
} from './hooks/index.js';
