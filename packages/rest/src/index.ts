import Resource from '@rest-hooks/rest/Resource';
import BaseResource from '@rest-hooks/rest/BaseResource';
import HookableResource from '@rest-hooks/rest/HookableResource';

export { Resource, BaseResource, HookableResource };

export type {
  RestEndpoint,
  RestFetch,
  FetchMutate,
  FetchGet,
} from '@rest-hooks/rest/types';

export * from '@rest-hooks/endpoint';
