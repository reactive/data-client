export {
  useCache,
  useFetcher,
  useRetrieve,
  useResource,
  useSubscription,
  useMeta,
  useError,
  useInvalidator,
  useResetter,
  useDenormalized,
  SimpleRecord,
  Entity as NestedEntity,
  isEntity,
  FlatEntity as Entity,
  schema as schemas,
  // TODO: get rid of these exports once core has been out for a while
  usePromisifiedDispatch,
  Endpoint,
  Index,
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
  UpdateFunction,
  // TODO: get rid of these exports once core has been out for a while
  FetchAction,
  InvalidateAction,
  UnsubscribeAction,
  SubscribeAction,
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
  Normalize,
  NormalizeNullable,
  Denormalize,
  DenormalizeNullable,
  EndpointExtraOptions,
  FetchFunction,
  ResolveType,
  EndpointParam,
  InferReturn,
  EndpointInterface,
  ReadEndpoint,
  MutateEndpoint,
  IndexInterface,
  IndexParams,
  ArrayElement,
  NetworkError,
} from '@rest-hooks/core';

export { Resource, SimpleResource } from '@rest-hooks/legacy';
export type { SchemaDetail, SchemaList, Method } from '@rest-hooks/legacy';
export {
  CacheProvider,
  ExternalCacheProvider,
  PromiseifyMiddleware,
  NetworkErrorBoundary,
  mapMiddleware,
} from './react-integration';

export {
  PollingSubscription,
  DevToolsManager,
  SubscriptionManager,
  DefaultConnectionListener,
} from './manager';
export type { ConnectionListener, DevToolsConfig } from './manager';
export { default as useSelectionUnstable } from './react-integration/hooks/useSelection';
export * as __INTERNAL__ from './internal';
