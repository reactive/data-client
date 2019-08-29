import {
  Resource,
  SimpleResource,
  SuperagentResource,
  FetchShape,
  DeleteShape,
  ReadShape,
  MutateShape,
  Schema,
  SchemaList,
  SchemaDetail,
  SchemaOf,
  schemas,
} from './resource';
import NetworkManager from './state/NetworkManager';
import PollingSubscription from './state/PollingSubscription';
import SubscriptionManager from './state/SubscriptionManager';
import reducer, { initialState } from './state/reducer';
import { useDenormalized } from './state/selectors';
import {
  useCache,
  useCacheNew,
  useFetcher,
  useRetrieve,
  useResource,
  useResourceNew,
  useSubscription,
  useResultCache,
  useMeta,
  useError,
  CacheProvider,
  useInvalidator,
  ExternalCacheProvider,
  NetworkErrorBoundary,
  NetworkError,
} from './react-integration';
import useSelectionUnstable from './react-integration/hooks/useSelection';
import { Request as RequestType } from 'superagent';
import {
  AbstractInstanceType,
  RequestOptions,
  Method,
  State,
  FetchAction,
  ReceiveAction,
  RPCAction,
  PurgeAction,
  OptimisticUpdateAction,
  Middleware,
  Manager,
} from './types';
import { StateContext, DispatchContext } from './react-integration/context';

const __INTERNAL__ = {
  initialState,
  StateContext,
  DispatchContext,
};

export type DeleteShape<
  S extends schemas.Entity,
  Params extends Readonly<object> = Readonly<object>
> = DeleteShape<S, Params>;
export type MutateShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = Readonly<object> | undefined
> = MutateShape<S, Params, Body>;
export type ReadShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = Readonly<object> | undefined
> = ReadShape<S, Params, Body>;
export type FetchShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = Readonly<object> | undefined
> = FetchShape<S, Params, Body>;

export type State<T> = State<T>;
export type Schema<T = any> = Schema<T>;
export type SchemaList<T> = SchemaList<T>;
export type SchemaDetail<T> = SchemaDetail<T>;
export type SchemaOf<T> = SchemaOf<T>;
export type AbstractInstanceType<T> = AbstractInstanceType<T>;
export type RequestOptions = RequestOptions;
export type Method = Method;

export type NetworkError = NetworkError;
export type Request = RequestType;
export type FetchAction<
  Payload extends object | string | number = object | string | number
> = FetchAction<Payload>;
export type ReceiveAction<
  Payload extends object | string | number = object | string | number
> = ReceiveAction<Payload>;
export type RPCAction<
  Payload extends object | string | number = object | string | number
> = RPCAction<Payload>;
export type PurgeAction = PurgeAction;
export type OptimisticUpdateAction = OptimisticUpdateAction;

export type Middleware = Middleware;
export type Manager = Manager;

export {
  Resource,
  SimpleResource,
  SuperagentResource,
  CacheProvider,
  ExternalCacheProvider,
  useCache,
  useCacheNew,
  useFetcher,
  useRetrieve,
  useInvalidator,
  useResource,
  useResourceNew,
  useSubscription,
  useResultCache,
  useMeta,
  useError,
  useSelectionUnstable,
  useDenormalized,
  NetworkManager,
  SubscriptionManager,
  PollingSubscription,
  reducer,
  NetworkErrorBoundary,
  schemas,
  __INTERNAL__,
};
