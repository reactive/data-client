import Resource from './Resource';
import {
  SchemaOf,
  DeleteShape,
  ReadShape,
  MutateShape,
  RequestShape,
  isDeleteShape,
  RequestResource,
  isEntity,
} from './types';
import {
  SchemaArray,
  Schema,
  SchemaBase,
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
export type RequestShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object> | void = Readonly<object> | undefined
> = RequestShape<S, Params, Body>;
export type Schema<T = any> = Schema<T>;
export type SchemaOf<T> = SchemaOf<T>;
export type SchemaArray<T> = SchemaArray<T>;
export type SchemaBase<T> = SchemaBase<T>;
export type RequestResource<RS> = RequestResource<RS>;

export { Resource, isEntity, normalize, denormalize, isDeleteShape, schemas };
