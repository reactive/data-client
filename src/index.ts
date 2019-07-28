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
import {
  useCache,
  useFetcher,
  useRetrieve,
  useResource,
  useSubscription,
  useResultCache,
  useMeta,
  useError,
  useSelectionUnstable,
  CacheProvider,
  useInvalidator,
  ExternalCacheProvider,
  NetworkErrorBoundary,
  NetworkError,
} from './react-integration';
import { Request as RequestType } from 'superagent';
import {
  AbstractInstanceType,
  RequestOptions,
  Method,
  State,
  FetchAction,
  ReceiveAction,
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
  Body extends Readonly<object> | void = Readonly<object> | undefined
> = MutateShape<S, Params, Body>;
export type ReadShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object> | void = Readonly<object> | undefined
> = ReadShape<S, Params, Body>;
export type FetchShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object> | void = Readonly<object> | undefined
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
export type FetchAction = FetchAction;
export type ReceiveAction = ReceiveAction;

export type Middleware = Middleware;
export type Manager = Manager;

export {
  Resource,
  SimpleResource,
  SuperagentResource,
  CacheProvider,
  ExternalCacheProvider,
  useCache,
  useFetcher,
  useRetrieve,
  useInvalidator,
  useResource,
  useSubscription,
  useResultCache,
  useMeta,
  useError,
  useSelectionUnstable,
  NetworkManager,
  SubscriptionManager,
  PollingSubscription,
  reducer,
  NetworkErrorBoundary,
  schemas,
  __INTERNAL__,
};
