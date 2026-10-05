/** Value types for `Controller.set()`, including batch `set([Entity], rows)` */
import type { Denormalize, EntityInterface } from '@data-client/normalizr';

/** What one row normalizes to: a reference to one stored entity */
type EntityRef = string | { readonly id: string; readonly schema: string };

/** Schemas that write each row to one stored entity: Entity, Union, or Invalidate (batch delete).
 * Query, All and Collection don't: they normalize to lists, or Collection keys by args batch set() lacks. */
type SetEntitySchema =
  | EntityInterface
  | {
      _normalizeNullable(): EntityRef | undefined;
      // excludes Collection
      pk?: never;
    };

/** `[Entity]`, `schema.Array(Entity)` or `schema.Values(Entity)` (or of a Union or Invalidate) */
export type SetManySchema =
  | readonly SetEntitySchema[]
  | {
      readonly schema: SetEntitySchema | Record<string, EntityInterface>;
      // Array and Values; excludes schema.Object, whose queryKey() returns any
      schemaKey(): string;
      queryKey(...args: any): undefined;
      // excludes Entity, whose `any` returns match the members above
      pk?: never;
    };

type IsUnion<T, U = T> =
  T extends unknown ?
    [U] extends [T] ?
      false
    : true
  : never;

type FunctionKeys<U> = {
  [K in keyof U]: U[K] extends (...args: any) => any ? K : never;
}[keyof U];

/** Raw input for one field: numbers and strings coerce (literals stay exact);
 * objects are pre-normalize */
type SetField<T> =
  T extends number ?
    number extends T ?
      T | string
    : T
  : T extends string ?
    string extends T ?
      T | number
    : T
  : T extends object ? unknown
  : T;

/** Non-function keys of any member of U */
type FieldKeys<U> =
  U extends unknown ? Exclude<keyof U, FunctionKeys<U>> : never;

/** Input for field K, from each member of U that has it */
type MemberField<U, K> =
  U extends unknown ?
    K extends keyof U ?
      SetField<U[K]>
    : never
  : never;

/** Fields of one row (or a coerced primitive); like EntityFields, but without
 * key remapping (TS 4.0). A Union's members merge into one object type: checking
 * a row against it costs one comparison instead of one per member. */
type SetRow<U> =
  // EntityMixin and other untyped entities
  0 extends 1 & U ? { readonly [k: string]: any }
  : [U] extends [object] ? { readonly [K in FieldKeys<U>]?: MemberField<U, K> }
  : SetField<U>;

/** Keeps S inferred from the schema alone: inferring it from the value too would
 * walk the value's type against every conditional in SetValue (TS 5.4 has NoInfer) */
export type SkipInfer<T, S> = [T][S extends unknown ? 0 : never];

export type SetManyValue<S> =
  S extends readonly (infer E)[] ?
    true extends IsUnion<E> ?
      readonly { 'Use a Union schema for several Entity types': never }[]
    : readonly SetItem<Denormalize<E>>[]
  : SetValue<S>;

/** Raw input `set()` normalizes for a Queryable */
export type SetValue<S> =
  InputSchema<InputSchema<InputSchema<S>>> extends infer N ?
    N extends EntityInterface ?
      SetRow<Denormalize<N>>
    : SetInput<Denormalize<N>>
  : never;

/** Query normalizes with its inner schema; its process() output is not input
 *
 * Applied three times in SetValue to unwrap nested Queries (TS 4.0 has no recursive aliases)
 */
type InputSchema<S> =
  S extends (
    {
      readonly schema: infer Sch;
      process(...args: any): any;
      // excludes Entity, whose static schema and process() match the members above
      pk?: never;
    }
  ) ?
    Sch
  : S;

/** Raw input for a denormalized value, like a Collection's list or a Union's row */
type SetInput<T> =
  0 extends 1 & T ? any
  : // not distributive, so a Union's members stay together for SetItem
  [T] extends [readonly (infer U)[]] ? readonly SetItem<U>[]
  : string extends keyof T ? { readonly [k: string]: SetItem<T[keyof T]> }
  : SetItem<T>;

/**
 * One member of a list or keyed object. Polymorphic rows may carry a
 * discriminator that is not an Entity field.
 */
type SetItem<U> =
  true extends IsUnion<U> ? SetRow<U> & { readonly [k: string]: unknown }
  : SetRow<U>;
