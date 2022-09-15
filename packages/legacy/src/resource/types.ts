import { schema as schemas, Schema } from '@rest-hooks/endpoint';

export type SchemaDetail<T> =
  | schemas.EntityInterface<T>
  | { [K: string]: any }
  | schemas.SchemaClass;

export type SchemaList<T> =
  | schemas.EntityInterface<T>[]
  | { [K: string]: any }
  | Schema[]
  | schemas.SchemaClass;

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';

export type NormalizedEntity<T> = T extends {
  prototype: infer U;
  schema: infer S;
}
  ? { [K in Exclude<keyof U, keyof S>]: U[K] } & { [K in keyof S]: string }
  : never;
