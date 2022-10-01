import type {
  Schema,
  Serializable,
  EntityInterface,
  NormalizedIndex,
  SchemaClass,
} from './interface.js';
import type WeakListMap from './WeakListMap.js';

export type AbstractInstanceType<T> = T extends { prototype: infer U }
  ? U
  : never;

export type NormalizedEntity<T> = T extends {
  prototype: infer U;
  schema: infer S;
}
  ? { [K in Exclude<keyof U, keyof S>]: U[K] } & { [K in keyof S]: string }
  : never;

export type DenormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Denormalize<S[K]> : S[K];
};

export type DenormalizeNullableObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? DenormalizeNullable<S[K]> : S[K];
};

export type NormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Normalize<S[K]> : S[K];
};

export type NormalizedNullableObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? NormalizeNullable<S[K]> : S[K];
};

interface NestedSchemaClass<T = any> {
  schema: Record<string, Schema>;
  prototype: T;
}

export interface RecordClass<T = any> extends NestedSchemaClass<T> {
  fromJS: (...args: any) => AbstractInstanceType<T>;
}

export interface DenormalizeCache {
  entities: {
    [key: string]: {
      [pk: string]: WeakListMap<object, EntityInterface>;
    };
  };
  results: {
    [key: string]: WeakListMap<object, any>;
  };
}

export type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> =
  keyof S['schema'] extends never
    ? S['prototype'] // this is the case of a non-set schema, which means it actually has no members
    : string extends keyof S['schema']
    ? S['prototype']
    : S['prototype'] /*& {
        [K in keyof S['schema']]: DenormalizeNullable<S['schema'][K]>;
      }*/;

export type DenormalizeReturnType<T> = T extends (
  input: any,
  unvisit: any,
) => [infer R, any, any]
  ? R
  : never;
export type NormalizeReturnType<T> = T extends (...args: any) => infer R
  ? R
  : never;

export type Denormalize<S> = S extends EntityInterface<infer U>
  ? U
  : S extends RecordClass
  ? AbstractInstanceType<S>
  : S extends SchemaClass
  ? DenormalizeReturnType<S['denormalize']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Denormalize<F>[]
  : S extends { [K: string]: any }
  ? DenormalizeObject<S>
  : S;

export type DenormalizeNullable<S> = S extends EntityInterface<any>
  ? DenormalizeNullableNestedSchema<S> | undefined
  : S extends RecordClass
  ? DenormalizeNullableNestedSchema<S>
  : S extends SchemaClass
  ? DenormalizeReturnType<S['_denormalizeNullable']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Denormalize<F>[] | undefined
  : S extends { [K: string]: any }
  ? DenormalizeNullableObject<S>
  : S;

export type Normalize<S> = S extends EntityInterface
  ? string
  : S extends RecordClass
  ? NormalizeObject<S['schema']>
  : S extends SchemaClass
  ? NormalizeReturnType<S['normalize']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Normalize<F>[]
  : S extends { [K: string]: any }
  ? NormalizeObject<S>
  : S;

export type NormalizeNullable<S> = S extends EntityInterface
  ? string | undefined
  : S extends RecordClass
  ? NormalizedNullableObject<S['schema']>
  : S extends SchemaClass
  ? NormalizeReturnType<S['_normalizeNullable']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Normalize<F>[] | undefined
  : S extends { [K: string]: any }
  ? NormalizedNullableObject<S>
  : S;

export type NormalizedSchema<E, R> = {
  entities: E;
  result: R;
  indexes: NormalizedIndex;
  entityMeta: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly date: number;
        readonly expiresAt: number;
        readonly fetchedAt: number;
      };
    };
  };
};

export type EntityMap<T = any> = Record<string, EntityInterface<T>>;
