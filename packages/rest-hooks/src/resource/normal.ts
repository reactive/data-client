import {
  schema as schemas,
  Schema,
  Denormalize as DenormalizeCore,
  DenormalizeNullable as DenormalizeNullableCore,
  Normalize as NormalizeCore,
  NormalizeNullable as NormalizeNullableCore,
} from '@rest-hooks/normalizr';
export * from '@rest-hooks/normalizr';
export { schemas };

export type SchemaDetail<T> =
  | schemas.EntityInterface<T>
  | { [K: string]: any }
  | schemas.SchemaClass;

export type SchemaList<T> =
  | schemas.EntityInterface<T>[]
  | { [K: string]: any }
  | Schema[]
  | schemas.SchemaClass;

export type Denormalize<S> = Extract<S, schemas.EntityInterface> extends never
  ? Extract<S, schemas.EntityInterface[]> extends never
    ? DenormalizeCore<S>
    : DenormalizeCore<Extract<S, schemas.EntityInterface[]>>
  : DenormalizeCore<Extract<S, schemas.EntityInterface>>;

export type DenormalizeNullable<S> = Extract<
  S,
  schemas.EntityInterface
> extends never
  ? Extract<S, schemas.EntityInterface[]> extends never
    ? DenormalizeNullableCore<S>
    : DenormalizeNullableCore<Extract<S, schemas.EntityInterface[]>>
  : DenormalizeNullableCore<Extract<S, schemas.EntityInterface>>;

export type Normalize<S> = Extract<S, schemas.EntityInterface> extends never
  ? Extract<S, schemas.EntityInterface[]> extends never
    ? NormalizeCore<S>
    : NormalizeCore<Extract<S, schemas.EntityInterface[]>>
  : NormalizeCore<Extract<S, schemas.EntityInterface>>;

export type NormalizeNullable<S> = Extract<
  S,
  schemas.EntityInterface
> extends never
  ? Extract<S, schemas.EntityInterface[]> extends never
    ? NormalizeNullableCore<S>
    : NormalizeNullableCore<Extract<S, schemas.EntityInterface[]>>
  : NormalizeNullableCore<Extract<S, schemas.EntityInterface>>;
