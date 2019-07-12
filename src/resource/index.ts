import Resource from './Resource';
import {
  SchemaOf,
  DeleteShape,
  ReadShape,
  MutateShape,
  FetchShape,
  isDeleteShape,
  RequestResource,
  isEntity,
} from './types';
import {
  SchemaMany,
  Schema,
  SchemaOne,
  normalize,
  denormalize,
  schemas,
} from './normal';

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
export type Schema<T = any> = Schema<T>;
export type SchemaOf<T> = SchemaOf<T>;
export type SchemaMany<T> = SchemaMany<T>;
export type SchemaOne<T> = SchemaOne<T>;
export type RequestResource<RS> = RequestResource<RS>;

export { Resource, isEntity, normalize, denormalize, isDeleteShape, schemas };
