Object.hasOwn =
  Object.hasOwn ||
  /* istanbul ignore next */ function hasOwn(it, key) {
    return Object.prototype.hasOwnProperty.call(it, key);
  };
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
  RestInstance,
  KeyofRestEndpoint,
  RestEndpointConstructorOptions,
  AddEndpoint,
  PaginationFieldEndpoint,
  PaginationEndpoint,
} from './RestEndpoint.js';
export { default as createResource } from './createResource.js';
export type { Resource } from './resourceTypes.js';
export type { ResourceOptions, ResourceGenerics } from './resourceTypes.js';
export type {
  ResourceExtension,
  ResourceEndpointExtensions,
  CustomResource,
  ExtendedResource,
} from './resourceExtensionTypes.js';
export { default as hookifyResource } from './hookifyResource.js';
export type {
  HookResource,
  HookableEndpointInterface,
} from './hookifyResource.js';
export { default as NetworkError } from './NetworkError.js';
export type { OptionsToFunction } from './OptionsToFunction.js';
export type {
  ShortenPath,
  PathArgs,
  PathKeys,
  KeysToArgs,
  PathArgsAndSearch,
} from './pathTypes.js';

export * from '@data-client/endpoint';
export * from './RestEndpoint.js';
