import { EntityFields } from './EntityFields.js';
import type {
  Schema,
  Serializable,
  EntityInterface,
  NormalizedIndex,
  Queryable,
} from './interface.js';

export interface EntityPath {
  key: string;
  pk: string;
}

// TypeScript <4.2 InstanceType<> does not work on abstract classes
export type AbstractInstanceType<T> =
  T extends new (...args: any) => infer U ? U
  : T extends { prototype: infer U } ? U
  : never;

export type NormalizedEntity<T> =
  T extends (
    {
      prototype: infer U;
      schema: infer S;
    }
  ) ?
    { [K in Exclude<keyof U, keyof S>]: U[K] } & { [K in keyof S]: string }
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

export type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> =
  keyof S['schema'] extends never ?
    S['prototype'] // this is the case of a non-set schema, which means it actually has no members
  : string extends keyof S['schema'] ? S['prototype']
  : S['prototype'] /*& {
        [K in keyof S['schema']]: DenormalizeNullable<S['schema'][K]>;
      }*/;

export type NormalizeReturnType<T> =
  T extends (...args: any) => infer R ? R : never;

export type Denormalize<S> =
  S extends EntityInterface<infer U> ? U
  : S extends RecordClass ? AbstractInstanceType<S>
  : S extends { denormalize: (...args: any) => any } ?
    ReturnType<S['denormalize']>
  : S extends Serializable<infer T> ? T
  : S extends Array<infer F> ? Denormalize<F>[]
  : S extends { [K: string]: any } ? DenormalizeObject<S>
  : S;

export type DenormalizeNullable<S> =
  S extends EntityInterface<any> ?
    DenormalizeNullableNestedSchema<S> | undefined
  : S extends RecordClass ? DenormalizeNullableNestedSchema<S>
  : S extends { _denormalizeNullable: (...args: any) => any } ?
    ReturnType<S['_denormalizeNullable']>
  : S extends Serializable<infer T> ? T
  : S extends Array<infer F> ? Denormalize<F>[] | undefined
  : S extends { [K: string]: any } ? DenormalizeNullableObject<S>
  : S;

export type Normalize<S> =
  S extends EntityInterface ? string
  : S extends RecordClass ? NormalizeObject<S['schema']>
  : S extends { normalize: (...args: any) => any } ?
    NormalizeReturnType<S['normalize']>
  : S extends Serializable<infer T> ? T
  : S extends Array<infer F> ? Normalize<F>[]
  : S extends { [K: string]: any } ? NormalizeObject<S>
  : S;

export type NormalizeNullable<S> =
  S extends EntityInterface ? string | undefined
  : S extends RecordClass ? NormalizedNullableObject<S['schema']>
  : S extends { _normalizeNullable: (...args: any) => any } ?
    NormalizeReturnType<S['_normalizeNullable']>
  : S extends Serializable<infer T> ? T
  : S extends Array<infer F> ? Normalize<F>[] | undefined
  : S extends { [K: string]: any } ? NormalizedNullableObject<S>
  : S;

export type NormalizedSchema<
  E extends Record<string, Record<string, any> | undefined>,
  R,
> = {
  entities: E;
  result: R;
  indexes: NormalizedIndex;
  entityMeta: EntitiesToMeta<E>;
};

export interface StoreData<
  E extends Record<string, Record<string, any> | undefined>,
> {
  entities: Readonly<E>;
  indexes: Readonly<NormalizedIndex>;
  entityMeta: EntitiesToMeta<E>;
}

export type EntitiesToMeta<
  E extends Record<string, Record<string, any> | undefined>,
> = {
  readonly [entityKey in keyof E]: {
    readonly [pk in keyof E[entityKey]]: NormalizeMeta;
  };
};

export interface NormalizeMeta {
  expiresAt: number;
  date: number;
  fetchedAt: number;
}

export type EntityMap<T = any> = Record<string, EntityInterface<T>>;

export type SchemaArgs<S extends Queryable> =
  S extends EntityInterface<infer U> ? [EntityFields<U>]
  : S extends (
    {
      queryKey(
        args: infer Args,
        queryKey: (...args: any) => any,
        getEntity: any,
        getIndex: any,
      ): any;
    }
  ) ?
    Args
  : never;
