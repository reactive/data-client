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
  | schemas.Entity<T>
  | { [K: string]: any }
  | schemas.SchemaClass;

export type SchemaList<T> =
  | schemas.Entity<T>[]
  | { [K: string]: any }
  | Schema[]
  | schemas.SchemaClass;

export type Denormalize<S> = Extract<S, schemas.Entity> extends never
  ? (Extract<S, schemas.Entity[]> extends never
      ? DenormalizeCore<S>
      : DenormalizeCore<Extract<S, schemas.Entity[]>>)
  : DenormalizeCore<Extract<S, schemas.Entity>>;

export type DenormalizeNullable<S> = Extract<S, schemas.Entity> extends never
  ? (Extract<S, schemas.Entity[]> extends never
      ? DenormalizeNullableCore<S>
      : DenormalizeNullableCore<Extract<S, schemas.Entity[]>>)
  : DenormalizeNullableCore<Extract<S, schemas.Entity>>;

export type Normalize<S> = Extract<S, schemas.Entity> extends never
  ? (Extract<S, schemas.Entity[]> extends never
      ? NormalizeCore<S>
      : NormalizeCore<Extract<S, schemas.Entity[]>>)
  : NormalizeCore<Extract<S, schemas.Entity>>;

export type NormalizeNullable<S> = Extract<S, schemas.Entity> extends never
  ? (Extract<S, schemas.Entity[]> extends never
      ? NormalizeNullableCore<S>
      : NormalizeNullableCore<Extract<S, schemas.Entity[]>>)
  : NormalizeNullableCore<Extract<S, schemas.Entity>>;
