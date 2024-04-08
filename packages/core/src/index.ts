Object.hasOwn =
  Object.hasOwn ||
  /* istanbul ignore next */ function hasOwn(it, key) {
    return Object.prototype.hasOwnProperty.call(it, key);
  };

export * as __INTERNAL__ from './internal.js';
export type {
  NetworkError,
  UnknownError,
  ErrorTypes,
  Schema,
  EndpointInterface,
  EntityInterface,
  ResolveType,
  DenormalizeNullable,
  Denormalize,
  Normalize,
  NormalizeNullable,
  FetchFunction,
  EndpointExtraOptions,
  Queryable,
  SchemaArgs,
} from '@data-client/normalizr';
export { ExpiryStatus } from '@data-client/normalizr';
export {
  default as NetworkManager,
  ResetError,
} from './manager/NetworkManager.js';
export {
  default as createReducer,
  initialState,
} from './state/reducer/createReducer.js';
export { default as applyManager } from './manager/applyManager.js';

export { default as Controller } from './controller/Controller.js';
export type {
  DataClientDispatch,
  GenericDispatch,
} from './controller/Controller.js';
export { default as createFetch } from './controller/createFetch.js';
export { default as createSet } from './controller/createSet.js';

export * from './controller/types.js';
export * as actionTypes from './actionTypes.js';
/* istanbul ignore next */
export * from './types.js';
export * from './manager/index.js';
