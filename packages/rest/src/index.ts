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
export type { RestEndpoint as IRestEndpoint } from './RestEndpointTypes.js';
export { getUrlBase, getUrlTokens } from './RestHelpers.js';
export { default as resource } from './resource.js';
export { default as createResource } from './resource.js';
export type {
  Resource,
  ResourceOptions,
  ResourceGenerics,
  ResourceInterface,
} from './resourceTypes.js';
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
