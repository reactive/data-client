// Mirrors SetValue in normalizr/src/setTypes.ts; keep in sync
import type { EntityInterface } from './interface.js';
import type { Denormalize } from './normal.js';

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

/** Fields of one row (or a coerced primitive); like EntityFields, but distributive
 * and without key remapping (TS 4.0). A Union gets one row per member, so a
 * discriminator like `type` selects the member the other fields are checked against. */
type SetRow<U> =
  // EntityMixin and other untyped entities
  0 extends 1 & U ? { readonly [k: string]: any }
  : U extends object ?
    { readonly [K in Exclude<keyof U, FunctionKeys<U>>]?: SetField<U[K]> }
  : SetField<U>;

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
  : // not distributive: SetRow splits a Union into its members itself
  [T] extends [readonly (infer U)[]] ? readonly SetRow<U>[]
  : string extends keyof T ? { readonly [k: string]: SetRow<T[keyof T]> }
  : SetRow<T>;
