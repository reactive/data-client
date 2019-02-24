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
import { RestProvider, hooks, NetworkErrorBoundary } from './react-integration';
import { makeSchemaSelector } from './state/selectors';
import { Request as RequestType } from 'superagent';
import { AbstractInstanceType } from './types';

export type DeleteShape<
Params extends Readonly<object>,
Body extends Readonly<object> | void
> = DeleteShape<Params, Body>;
export type MutateShape<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
> = MutateShape<Params, Body, S>;
export type ReadShape<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
> = ReadShape<Params, Body, S>;
export type RequestShape<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
> = RequestShape<Params, Body, S>;

export type Schema<T = any> = Schema<T>;
export type SchemaArray<T> = SchemaArray<T>;
export type SchemaBase<T> = SchemaBase<T>;
export type SchemaOf<T> = SchemaOf<T>;
export type AbstractInstanceType<T> = AbstractInstanceType<T>;

export type Request = RequestType;

export {
  Resource,
  RestProvider,
  hooks,
  makeSchemaSelector,
  NetworkManager,
  NetworkErrorBoundary,
  schemas,
};
