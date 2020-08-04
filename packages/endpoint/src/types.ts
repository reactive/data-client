import { schema, Schema } from '@rest-hooks/normalizr';

import { Normalize } from './normal';
import { EndpointInterface } from './interface';

export interface EndpointExtraOptions {
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  readonly optimisticUpdate?: (
    params: Readonly<object>,
    body: Readonly<object | string> | void,
  ) => any;
  /** User-land extra data to send */
  readonly extra?: any;
}
export type FetchFunction<P = any, B = any, R = any> = (
  params?: P,
  body?: B,
) => Promise<R>;

export type OptimisticUpdateParams<
  SourceSchema extends Schema,
  Dest extends EndpointInterface<FetchFunction, Schema, any>
> = [
  Dest,
  Parameters<Dest>[0],
  UpdateFunction<SourceSchema, Exclude<Dest['schema'], undefined>>,
];

export type UpdateFunction<
  SourceSchema extends Schema,
  DestSchema extends Schema
> = (
  sourceResults: Normalize<SourceSchema>,
  destResults: Normalize<DestSchema> | undefined,
) => Normalize<DestSchema>;

export type SchemaDetail<T> =
  | schema.EntityInterface<T>
  | { [K: string]: any }
  | schema.SchemaClass;

export type SchemaList<T> =
  | schema.EntityInterface<T>[]
  | { [K: string]: any }
  | Schema[]
  | schema.SchemaClass;
