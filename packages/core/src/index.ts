export * as __INTERNAL__ from './internal.js';
export type {
  NetworkError,
  UnknownError,
  ErrorTypes,
  Schema,
  EndpointInterface,
  EntityInterface,
  SchemaClass,
  ResolveType,
  DenormalizeNullable,
  Denormalize,
  Normalize,
  NormalizeNullable,
  FetchFunction,
  EndpointExtraOptions,
  Queryable,
  SchemaArgs,
  NI,
} from '@data-client/normalizr';
export { ExpiryStatus } from '@data-client/normalizr';
export {
  default as NetworkManager,
  ResetError,
} from './manager/NetworkManager.js';
export * from './state/GCPolicy.js';
export {
  default as createReducer,
  initialState,
} from './state/reducer/createReducer.js';
export { default as applyManager } from './manager/applyManager.js';
export { default as initManager } from './manager/initManager.js';

export { default as Controller } from './controller/Controller.js';
export type {
  DataClientDispatch,
  GenericDispatch,
} from './controller/Controller.js';
export * as actions from './controller/actions/index.js';

export * from './controller/types.js';
/** @see https://dataclient.io/docs/api/Actions */
export * as actionTypes from './actionTypes.js';
/* istanbul ignore next */
export * from './types.js';
export * from './manager/index.js';
