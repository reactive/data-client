import type { EntityFields } from './EntityFields.js';
import type { Schema, EntityInterface } from './interface.js';

export type SchemaArgs<S extends Schema> =
  S extends EntityInterface<infer U> ? [EntityFields<U>]
  : S extends (
    {
      queryKey(args: infer Args, ...rest: any): any;
    }
  ) ?
    Args
  : S extends { [K: string]: any } ? ObjectArgs<S>
  : never;

export type ObjectArgs<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? SchemaArgs<S[K]> : never;
}[keyof S];
