import Resource from './Resource';
import {
  SchemaOf,
  DeleteShape,
  ReadShape,
  MutateShape,
  RequestShape,
  isReadShape,
  isMutateShape,
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
export type SchemaOf<T> = SchemaOf<T>;
export type SchemaArray<T> = SchemaArray<T>;
export type SchemaBase<T> = SchemaBase<T>;
export type RequestResource<RS> = RequestResource<RS>;

export {
  Resource,
  isReadShape,
  isMutateShape,
  isEntity,
  normalize,
  denormalize,
  schemas,
};
