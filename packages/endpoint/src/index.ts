export type {
  EndpointInterface,
  ReadEndpoint,
  MutateEndpoint,
  IndexInterface,
  IndexParams,
  ArrayElement,
} from './interface';
export type { EndpointOptions, FetchFunction } from './endpoint';
export type { EndpointExtraOptions } from './types';

export { default as Endpoint } from './endpoint';
export { default as Index } from './indexEndpoint';
