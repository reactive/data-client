export type {
  EndpointInterface,
  ReadEndpoint,
  MutateEndpoint,
  IndexInterface,
  IndexParams,
  ArrayElement,
} from './interface';
export type { EndpointOptions, EndpointInstance } from './endpoint';
export type {
  Normalize,
  NormalizeNullable,
  Denormalize,
  DenormalizeNullable,
} from './normal';
export {
  normalize,
  denormalize,
  schema,
  AbstractInstanceType,
  Schema,
  Entity,
  isEntity,
  SimpleRecord,
  DELETED,
} from '@rest-hooks/normalizr';
export type {
  EndpointExtraOptions,
  FetchFunction,
  OptimisticUpdateParams,
  UpdateFunction,
  SchemaDetail,
  SchemaList,
} from './types';
export type { ResolveType, EndpointParam, InferReturn } from './utility';

export { default as Endpoint } from './endpoint';
export { default as Index } from './indexEndpoint';
