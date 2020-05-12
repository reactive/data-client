import {
  initialState,
  StateContext,
  DispatchContext,
  hasUsableData,
  __INTERNAL__ as _INT_,
} from '@rest-hooks/core';

export {
  Entity as NestedEntity,
  isEntity,
  FlatEntity as Entity,
  schema as schemas,
} from '@rest-hooks/normalizr';

export {
  useCache,
  useFetcher,
  useRetrieve,
  useResource,
  useSubscription,
  useMeta,
  useError,
  CacheProvider,
  useInvalidator,
  useResetter,
  useDenormalized,
  SimpleRecord,
  // TODO: get rid of these exports once core has been out for a while
  usePromisifiedDispatch,
} from '@rest-hooks/core';
export type {
  FetchShape,
  ReadShape,
  MutateShape,
  DeleteShape,
  SetShapeParams,
  ParamsFromShape,
  AbstractInstanceType,
  FetchOptions,
  Method,
  UpdateFunction,
  // TODO: get rid of these exports once core has been out for a while
  FetchAction,
  InvalidateAction,
  UnsubscribeAction,
  SubscribeAction,
  PurgeAction,
  ResetAction,
  ReceiveAction,
  State,
  ReceiveTypes,
  PK,
  Dispatch,
  Middleware,
  MiddlewareAPI,
  ActionTypes,
  Manager,
  Schema,
} from '@rest-hooks/core';
export { Resource, SimpleResource } from './resource';
export type { SchemaDetail, SchemaList } from './resource/types';
export {
  ExternalCacheProvider,
  PromiseifyMiddleware,
  NetworkErrorBoundary,
} from './react-integration';
export type { NetworkError } from './react-integration';

export {
  PollingSubscription,
  SubscriptionManager,
  DefaultConnectionListener,
} from './manager';
export type { ConnectionListener } from './manager';
export { default as useSelectionUnstable } from './react-integration/hooks/useSelection';

const { buildInferredResults, RIC } = _INT_;
export const __INTERNAL__ = {
  initialState,
  StateContext,
  DispatchContext,
  RIC,
  hasUsableData,
  buildInferredResults,
};
