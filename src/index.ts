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
  schemas,
} from './resource';
import NetworkManager from './state/NetworkManager';
import RIC from './state/RIC';
import PollingSubscription from './state/PollingSubscription';
import SubscriptionManager from './state/SubscriptionManager';
import reducer, { initialState } from './state/reducer';
import { useDenormalized } from './state/selectors';
import {
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
  ExternalCacheProvider,
  NetworkErrorBoundary,
  NetworkError,
} from './react-integration';
import useSelectionUnstable from './react-integration/hooks/useSelection';
import { Request as RequestType } from 'superagent';
import {
  AbstractInstanceType,
  FetchOptions,
  Method,
  State,
  FetchAction,
  ReceiveAction,
  RPCAction,
  PurgeAction,
  Dispatch,
  MiddlewareAPI,
  Middleware,
  Manager,
} from './types';
import { StateContext, DispatchContext } from './react-integration/context';

const __INTERNAL__ = {
  initialState,
  StateContext,
  DispatchContext,
  RIC,
};

export type DeleteShape<
  S extends schemas.Entity,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = undefined
> = DeleteShape<S, Params, Body>;
export type MutateShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = Readonly<object> | undefined
> = MutateShape<S, Params, Body>;
export type ReadShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>
> = ReadShape<S, Params>;
export type FetchShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = Readonly<object> | undefined
> = FetchShape<S, Params, Body>;

export type State<T> = State<T>;
export type Schema = Schema;
export type SchemaList<T> = SchemaList<T>;
export type SchemaDetail<T> = SchemaDetail<T>;
export type AbstractInstanceType<T> = AbstractInstanceType<T>;
export type FetchOptions = FetchOptions;
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

export type Dispatch<R extends React.Reducer<any, any>> = Dispatch<R>;
export type MiddlewareAPI<
  R extends React.Reducer<any, any> = React.Reducer<any, any>
> = MiddlewareAPI<R>;
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
  useResetter,
  useResource,
  useSubscription,
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
