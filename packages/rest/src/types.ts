import { schema as schemas, Schema } from '@rest-hooks/normalizr';

export type SchemaDetail<T> =
  | schemas.EntityInterface<T>
  | { [K: string]: any }
  | schemas.SchemaClass;

export type SchemaList<T> =
  | schemas.EntityInterface<T>[]
  | { [K: string]: any }
  | Schema[]
  | schemas.SchemaClass;
