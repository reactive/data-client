// Vue Data Client - Coming Soon
// This package will provide Vue 3 composables for @data-client/core

export { Controller, ExpiryStatus, actionTypes } from '@data-client/core';
export type {
  EndpointExtraOptions,
  FetchFunction,
  ResolveType,
  EndpointInterface,
  EntityInterface,
  Queryable,
  SchemaArgs,
  Schema,
  SchemaClass,
  DenormalizeNullable,
  Denormalize,
  Normalize,
  NormalizeNullable,
  FetchAction,
  InvalidateAction,
  UnsubscribeAction,
  SubscribeAction,
  ResetAction,
  SetAction,
  SetResponseAction,
  ActionTypes,
  NetworkError,
  UnknownError,
  ErrorTypes,
  AbstractInstanceType,
  UpdateFunction,
  State,
  PK,
  Dispatch,
  Middleware,
  MiddlewareAPI,
  Manager,
  GCInterface,
  GCOptions,
  CreateCountRef,
  // used in Controller generic
  DataClientDispatch,
  GenericDispatch,
} from '@data-client/core';

// TODO: Add Vue-specific exports when implementation is ready
// export * from './composables/index.js';
// export * from './components/index.js';
// export * from './stores/index.js';
