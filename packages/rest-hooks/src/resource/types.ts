import { schema as schemas, Schema } from '@rest-hooks/core';

export type SchemaDetail<T> =
  | schemas.EntityInterface<T>
  | { [K: string]: any }
  | schemas.SchemaClass;

export type SchemaList<T> =
  | schemas.EntityInterface<T>[]
  | { [K: string]: any }
  | Schema[]
  | schemas.SchemaClass;
