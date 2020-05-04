import type { default as schema } from './schema';

export type AbstractInstanceType<T> = T extends { prototype: infer U }
  ? U
  : never;

export type NormalizedEntity<T> = T extends {
  prototype: infer U;
  schema: infer S;
}
  ? { [K in Exclude<keyof U, keyof S>]: U[K] } & { [K in keyof S]: string }
  : never;

type DenormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Denormalize<S[K]> : S[K];
};

type DenormalizeNullableObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? DenormalizeNullable<S[K]> : S[K];
};

type NormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Normalize<S[K]> : S[K];
};

type NormalizedNullableObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? NormalizeNullable<S[K]> : S[K];
};

export type DenormalizeReturnType<T> = T extends (
  input: any,
  unvisit: any,
) => [infer R, any]
  ? R
  : never;
export type NormalizeReturnType<T> = T extends (...args: any) => infer R
  ? R
  : never;

export type Denormalize<S> = S extends schema.SchemaClass
  ? DenormalizeReturnType<S['denormalize']>
  : S extends Array<infer F>
  ? Denormalize<F>[]
  : S extends { [K: string]: any }
  ? DenormalizeObject<S>
  : S;

export type DenormalizeNullable<S> = S extends schema.SchemaClass
  ? DenormalizeReturnType<S['_denormalizeNullable']>
  : S extends Array<infer F>
  ? Denormalize<F>[] | undefined
  : S extends { [K: string]: any }
  ? DenormalizeNullableObject<S>
  : S;

export type Normalize<S> = S extends schema.SchemaClass
  ? NormalizeReturnType<S['normalize']>
  : S extends Array<infer F>
  ? Normalize<F>[]
  : S extends { [K: string]: any }
  ? NormalizeObject<S>
  : S;

export type NormalizeNullable<S> = S extends schema.SchemaClass
  ? NormalizeReturnType<S['_normalizeNullable']>
  : S extends Array<infer F>
  ? Normalize<F>[] | undefined
  : S extends { [K: string]: any }
  ? NormalizedNullableObject<S>
  : S;

export type Schema =
  | null
  | string
  | { [K: string]: any }
  | Schema[]
  | schema.SchemaClass;

export type NormalizedIndex = {
  readonly [entityKey: string]: {
    readonly [indexName: string]: { readonly [lookup: string]: string };
  };
};

export type NormalizedSchema<E, R> = {
  entities: E;
  result: R;
  indexes: NormalizedIndex;
};
