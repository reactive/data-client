/** Types for batch `Controller.set([Entity], rows)` */
import type { Denormalize } from '@data-client/normalizr';

/** Matches Entity classes (same members Denormalize<> checks).
 * Not EntityInterface: older @data-client/endpoint versions declare Entity.pk() with mutable `args`. */
interface EntityLike {
  createIfValid(...args: any): any;
  pk(...args: any): any;
  readonly key: string;
  prototype: any;
}

type EntityMapLike = { readonly [k: string]: EntityLike };

/** What one row normalizes to: a reference to one stored entity */
type EntityRef = string | { readonly id: string; readonly schema: string };

/** Schemas that write each row to one stored entity: Entity, Union, or Invalidate (batch delete).
 * Query, All and Collection don't: they normalize to lists, or Collection keys by args batch set() lacks. */
type SetEntitySchema =
  | EntityLike
  | {
      _normalizeNullable(): EntityRef | undefined;
      // excludes Collection
      pk?: never;
    };

/** `[Entity]`, `schema.Array(Entity)` or `schema.Values(Entity)` (or of a Union or Invalidate) */
export type SetManySchema =
  | readonly SetEntitySchema[]
  | {
      readonly schema: SetEntitySchema | EntityMapLike;
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

/** Raw input for one field: numbers and strings coerce; objects are pre-normalize */
type SetField<T> =
  T extends number ? T | string
  : T extends string ? T | number
  : T extends object ? unknown
  : T;

/** Fields of one row; like EntityFields, but distributive and without key remapping (TS 4.0) */
type SetRow<U> =
  // EntityMixin and other untyped entities
  0 extends 1 & U ? { readonly [k: string]: any }
  : U extends unknown ?
    { readonly [K in Exclude<keyof U, FunctionKeys<U>>]?: SetField<U[K]> }
  : never;

/** Polymorphic rows may carry a discriminator that is not an Entity field */
type SetRowOf<Sch, U> =
  Sch extends EntityLike ? SetRow<U>
  : SetRow<U> & { readonly [k: string]: unknown };

export type SetManyValue<S> =
  S extends readonly (infer E)[] ?
    true extends IsUnion<E> ?
      readonly { 'Use a Union schema for several Entity types': never }[]
    : readonly SetRowOf<E, Denormalize<E>>[]
  : S extends { readonly schema: infer Sch } ?
    Denormalize<S> extends readonly (infer U)[] ? readonly SetRowOf<Sch, U>[]
    : Denormalize<S> extends { readonly [k: string]: infer U } ?
      { readonly [k: string]: SetRowOf<Sch, U> }
    : never
  : never;
