export { default as useFetcher } from './useFetcher';
export { default as createFetch } from './createFetch';
export { default as Resource } from './rest/Resource';
export { default as BaseResource } from './rest/BaseResource';
import { schema, Entity } from '@rest-hooks/endpoint';
const Delete = schema.Delete;
export { Delete, Entity };
export * from './rest/types';
