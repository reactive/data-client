/** This file exists to keep compatibility with SchemaDetail, and SchemaList type hacks
 * Support can be dropped once @rest-hooks/rest@5 support is dropped
 */
import type {
  Denormalize as DenormalizeCore,
  DenormalizeNullable as DenormalizeNullableCore,
  Normalize as NormalizeCore,
  NormalizeNullable as NormalizeNullableCore,
} from './types.js';
import type { EntityInterface } from './interface.js';

export type Denormalize<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? DenormalizeCore<S>
    : DenormalizeCore<Extract<S, EntityInterface[]>>
  : DenormalizeCore<Extract<S, EntityInterface>>;

export type DenormalizeNullable<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? DenormalizeNullableCore<S>
    : DenormalizeNullableCore<Extract<S, EntityInterface[]>>
  : DenormalizeNullableCore<Extract<S, EntityInterface>>;

export type Normalize<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? NormalizeCore<S>
    : NormalizeCore<Extract<S, EntityInterface[]>>
  : NormalizeCore<Extract<S, EntityInterface>>;

export type NormalizeNullable<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? NormalizeNullableCore<S>
    : NormalizeNullableCore<Extract<S, EntityInterface[]>>
  : NormalizeNullableCore<Extract<S, EntityInterface>>;
