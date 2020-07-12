export type {
  EndpointInterface,
  ReadEndpoint,
  MutateEndpoint,
  IndexInterface,
  IndexParams,
  ArrayElement,
} from './interface';
export type { EndpointOptions } from './endpoint';
export type {
  EndpointExtraOptions,
  FetchFunction,
  OptimisticUpdateParams,
  UpdateFunction,
} from './types';
export type { ResolveType, InferReturn } from './utility';

export { default as Endpoint } from './endpoint';
export { default as Index } from './indexEndpoint';
