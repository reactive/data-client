import { schemas, Schema, SchemaArray, SchemaBase } from './normal';

/** Defines the shape of a network request */
export interface RequestShape<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
> {
  readonly type: 'read' | 'mutate' | 'delete';
  fetch(url: string, body: Body): Promise<any>;
  getUrl(params: Params): string;
  readonly schema: S;
}

/** Purges a value from the server */
export interface DeleteShape<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends schemas.Entity
> extends RequestShape<Params, Body, S> {
  readonly type: 'delete';
  readonly schema: S;
}

/** To change values on the server */
export interface MutateShape<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
> extends RequestShape<Params, Body, S> {
  readonly type: 'mutate';
}

/** For retrieval requests */
export interface ReadShape<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
> extends RequestShape<Params, Body, S> {
  readonly type: 'read';
}

export function isDeleteShape(
  shape: RequestShape<any, any, any>
): shape is DeleteShape<any, any, any> {
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


