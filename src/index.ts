import {
  Resource,
  RequestShape,
  DeleteShape,
  ReadShape,
  MutateShape,
  Schema,
  SchemaArray,
  SchemaBase,
  SchemaOf,
  schemas,
} from './resource';
import NetworkManager from './state/NetworkManager';
import {
  useCache,
  useFetcher,
  useRetrieve,
  useResource,
  useSubscription,
  useResultCache,
  useMeta,
  useError,
  RestProvider,
  NetworkErrorBoundary,
  NetworkError,
} from './react-integration';
import { Request as RequestType } from 'superagent';
import { AbstractInstanceType, RequestOptions, Method } from './types';

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
export type RequestShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object> | void = Readonly<object> | undefined
> = RequestShape<S, Params, Body>;

export type Schema<T = any> = Schema<T>;
export type SchemaArray<T> = SchemaArray<T>;
export type SchemaBase<T> = SchemaBase<T>;
export type SchemaOf<T> = SchemaOf<T>;
export type AbstractInstanceType<T> = AbstractInstanceType<T>;
export type RequestOptions = RequestOptions;
export type Method = Method;

export type NetworkError = NetworkError;
export type Request = RequestType;

export {
  Resource,
  RestProvider,
  useCache,
  useFetcher,
  useRetrieve,
  useResource,
  useSubscription,
  useResultCache,
  useMeta,
  useError,
  NetworkManager,
  NetworkErrorBoundary,
  schemas,
};
