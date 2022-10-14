export { default as RestEndpoint } from './RestEndpoint.js';
export type {
  GetEndpoint,
  MutateEndpoint,
  Defaults,
  RestGenerics,
  FetchGet,
  FetchMutate,
  RestFetch,
  RestType,
  KeyofRestEndpoint,
  RestEndpointConstructorOptions,
} from './RestEndpoint.js';
export { default as createResource } from './createResource.js';
export type { Resource } from './createResource.js';
export { default as hookifyResource } from './hookifyResource.js';
export type {
  HookResource,
  HookableEndpointInterface,
} from './hookifyResource.js';
export { default as NetworkError } from './NetworkError.js';
export { default as paginationUpdate } from './paginationUpdate.js';

export type { ShortenPath, PathArgs, PathKeys } from './pathTypes.js';

export * from '@rest-hooks/endpoint';
