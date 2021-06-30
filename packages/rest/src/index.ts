import Resource from '@rest-hooks/rest/Resource';
import SimpleResource from '@rest-hooks/rest/SimpleResource';

export { Resource, SimpleResource };
export { default as EntityRecord } from '@rest-hooks/rest/EntityRecord';

export type {
  RestEndpoint,
  RestFetch,
  FetchMutate,
  FetchGet,
} from '@rest-hooks/rest/types';

export * from '@rest-hooks/endpoint';
