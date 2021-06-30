export type {
  EndpointInterface,
  ReadEndpoint,
  MutateEndpoint,
  IndexInterface,
  IndexParams,
  ArrayElement,
} from '@rest-hooks/endpoint/interface';
export type {
  EndpointOptions,
  EndpointInstance,
} from '@rest-hooks/endpoint/endpoint';
export type {
  Normalize,
  NormalizeNullable,
  Denormalize,
  DenormalizeNullable,
} from '@rest-hooks/endpoint/normal';
export { schema, Entity, isEntity, DELETED } from '@rest-hooks/normalizr';
export type { AbstractInstanceType, Schema } from '@rest-hooks/normalizr';
export type {
  EndpointExtraOptions,
  FetchFunction,
  OptimisticUpdateParams,
  UpdateFunction,
  SchemaDetail,
  SchemaList,
} from '@rest-hooks/endpoint/types';
export type {
  ResolveType,
  EndpointParam,
  InferReturn,
} from '@rest-hooks/endpoint/utility';

export { default as Endpoint } from '@rest-hooks/endpoint/endpoint';
export { default as Index } from '@rest-hooks/endpoint/indexEndpoint';
