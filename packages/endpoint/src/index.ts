export type {
  EndpointInterface,
  ReadEndpoint,
  MutateEndpoint,
  IndexInterface,
  IndexParams,
  ArrayElement,
} from './interface.js';
export type {
  EndpointOptions,
  EndpointInstance,
  EndpointInstanceInterface,
  EndpointExtendOptions,
} from './endpoint.js';
export type {
  Normalize,
  NormalizeNullable,
  Denormalize,
  DenormalizeNullable,
} from './normal.js';
export {
  schema,
  Entity,
  isEntity,
  DELETED,
  validateRequired,
} from '@rest-hooks/normalizr';
export type { AbstractInstanceType, Schema } from '@rest-hooks/normalizr';
export type {
  EndpointExtraOptions,
  FetchFunction,
  SimpleFetchFunction as FetchFunctionOld,
  OptimisticUpdateParams,
  UpdateFunction,
  SchemaDetail,
  SchemaList,
  SnapshotInterface,
  NetworkError,
  UnknownError,
  ErrorTypes,
} from './types.js';
export { ExpiryStatus } from './Expiry.js';
export type { ExpiryStatusInterface } from './Expiry.js';
export type { ResolveType, EndpointParam, InferReturn } from './utility.js';

export { default as Endpoint, ExtendableEndpoint } from './endpoint.js';
export type { KeyofEndpointInstance } from './endpoint.js';
export { default as Index } from './indexEndpoint.js';
export { default as AbortOptimistic } from './AbortOptimistic.js';
