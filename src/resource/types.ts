import { State } from '../types';
import {
  Schema,
  SchemaArray,
  SchemaBase,
  schema as normalizr,
} from 'normalizr';

/** Purges a value from the server */
export interface DeleteShape<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void
> {
  getUrl(params: Params): string;
  fetch(url: string, body: Body): Promise<any>;
}

/** To change values on the server */
export interface MutateShape<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
> extends DeleteShape<Params, Body> {
  readonly schema: S;
}

/** For retrieval requests */
export interface ReadShape<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
> extends MutateShape<Params, Body, S> {
  select(state: State<any>, params: Params): SchemaOf<S> | null;
}

/** Any sort of request shape */
export type RequestShape<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
> =
  | ReadShape<Params, Body, S>
  | MutateShape<Params, Body, S>
  | DeleteShape<Params, Body>;

export function isReadShape(
  shape: RequestShape<any, any, any>
): shape is ReadShape<any, any, any> {
  return Object.prototype.hasOwnProperty.call(shape, 'select');
}
export function isMutateShape(
  shape: RequestShape<any, any, any>
): shape is ReadShape<any, any, any> {
  return Object.prototype.hasOwnProperty.call(shape, 'schema');
}

export type ResultShape<RS> = RS extends { schema: infer U } ? U : never;
export type SelectReturn<RS> = RS extends {
  select: (...args: any[]) => infer U;
}
  ? U
  : never;
export type AlwaysSelect<RS> = NonNullable<SelectReturn<RS>>;
export type ParamArg<RS> = RS extends {
  getUrl: (params: infer U) => any;
}
  ? U
  : never;
export type BodyArg<RS> = RS extends {
  fetch: (url: any, body: infer U) => any;
}
  ? U
  : never;
export type RequestResource<RS> = SchemaOf<ResultShape<RS>>;

export function isEntity<T>(schema: Schema): schema is normalizr.Entity<T> {
  return (schema as normalizr.Entity<T>).key !== undefined;
}

export type SchemaOf<T> = T extends SchemaArray<infer R> ? R[] : T extends SchemaBase<infer R> ? R : never;
export type SchemaArray<T = any> = SchemaArray<T>;
export type SchemaBase<T = any> = SchemaBase<T>;
export type Schema<T = any> = Schema<T>;
