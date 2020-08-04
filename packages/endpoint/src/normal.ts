import {
  schema,
  Denormalize as DenormalizeCore,
  DenormalizeNullable as DenormalizeNullableCore,
  Normalize as NormalizeCore,
  NormalizeNullable as NormalizeNullableCore,
} from '@rest-hooks/normalizr';

export type Denormalize<S> = Extract<S, schema.EntityInterface> extends never
  ? Extract<S, schema.EntityInterface[]> extends never
    ? DenormalizeCore<S>
    : DenormalizeCore<Extract<S, schema.EntityInterface[]>>
  : DenormalizeCore<Extract<S, schema.EntityInterface>>;

export type DenormalizeNullable<S> = Extract<
  S,
  schema.EntityInterface
> extends never
  ? Extract<S, schema.EntityInterface[]> extends never
    ? DenormalizeNullableCore<S>
    : DenormalizeNullableCore<Extract<S, schema.EntityInterface[]>>
  : DenormalizeNullableCore<Extract<S, schema.EntityInterface>>;

export type Normalize<S> = Extract<S, schema.EntityInterface> extends never
  ? Extract<S, schema.EntityInterface[]> extends never
    ? NormalizeCore<S>
    : NormalizeCore<Extract<S, schema.EntityInterface[]>>
  : NormalizeCore<Extract<S, schema.EntityInterface>>;

export type NormalizeNullable<S> = Extract<
  S,
  schema.EntityInterface
> extends never
  ? Extract<S, schema.EntityInterface[]> extends never
    ? NormalizeNullableCore<S>
    : NormalizeNullableCore<Extract<S, schema.EntityInterface[]>>
  : NormalizeNullableCore<Extract<S, schema.EntityInterface>>;
