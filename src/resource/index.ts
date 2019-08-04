import Resource from './Resource';
import SimpleResource from './SimpleResource';
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
  SchemaList,
  Schema,
  SchemaDetail,
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
  Body extends Readonly<object | string> | void = Readonly<object | string> | undefined
> = MutateShape<S, Params, Body>;
export type ReadShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = Readonly<object | string> | undefined
> = ReadShape<S, Params, Body>;
export type FetchShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = Readonly<object | string> | undefined
> = FetchShape<S, Params, Body>;
export type Schema<T = any> = Schema<T>;
export type SchemaOf<T> = SchemaOf<T>;
export type SchemaList<T> = SchemaList<T>;
export type SchemaDetail<T> = SchemaDetail<T>;
export type RequestResource<RS> = RequestResource<RS>;
const SuperagentResource = Resource;

export {
  Resource,
  SimpleResource,
  SuperagentResource,
  isEntity,
  normalize,
  denormalize,
  isDeleteShape,
  schemas,
};
