import Resource from './Resource.js';
import BaseResource from './BaseResource.js';
import HookableResource from './HookableResource.js';

export { Resource, BaseResource, HookableResource };

export type {
  RestEndpoint,
  RestFetch,
  FetchMutate,
  FetchGet,
} from './types.js';

export * from '@rest-hooks/endpoint';
