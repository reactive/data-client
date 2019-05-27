import { schemas, Schema, SchemaArray, SchemaBase } from './normal';
import { RequestOptions } from '../types';

/** Defines the shape of a network request */
export interface RequestShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object> | void = Readonly<object> | undefined
> {
  readonly type: 'read' | 'mutate' | 'delete';
  fetch(url: string, body: Body): Promise<any>;
  getUrl(params: Params): string;
  readonly schema: S;
  readonly options?: RequestOptions;
}

/** Purges a value from the server */
export interface DeleteShape<
  S extends schemas.Entity,
  Params extends Readonly<object> = Readonly<object>
> extends RequestShape<S, Params, any> {
  readonly type: 'delete';
  readonly schema: S;
}

/** To change values on the server */
export interface MutateShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object> | void = Readonly<object> | undefined
> extends RequestShape<S, Params, Body> {
  readonly type: 'mutate';
}

/** For retrieval requests */
export interface ReadShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object> | void = Readonly<object> | undefined
> extends RequestShape<S, Params, Body> {
  readonly type: 'read';
}

export function isDeleteShape(
  shape: RequestShape<any, any, any>,
): shape is DeleteShape<any, any> {
  return shape.type === 'delete';
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

export function isEntity<T>(schema: Schema): schema is schemas.Entity<T> {
  return (schema as schemas.Entity<T>).key !== undefined;
}

export type SchemaOf<T> = T extends SchemaArray<infer R>
  ? R[]
  : T extends SchemaBase<infer R>
  ? R
  : never;
