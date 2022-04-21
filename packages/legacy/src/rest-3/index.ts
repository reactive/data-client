import Resource from './Resource.js';
import SimpleResource from './SimpleResource.js';

export { Resource, SimpleResource };
export { default as EntityRecord } from './EntityRecord.js';

export type {
  RestEndpoint,
  RestFetch,
  FetchMutate,
  FetchGet,
} from './types.js';

export * from '@rest-hooks/endpoint';
