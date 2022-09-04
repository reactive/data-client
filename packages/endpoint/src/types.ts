import { schema, Schema } from '@rest-hooks/normalizr';

import { Normalize } from './normal.js';
import { EndpointInterface } from './interface.js';
import { ResolveType } from './utility.js';
import SnapshotInterface from './SnapshotInterface.js';

export interface EndpointExtraOptions<F extends FetchFunction = FetchFunction> {
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Enables optimistic updates for this request - uses return value as assumed network response
   * @deprecated use https://resthooks.io/docs/api/Endpoint#getoptimisticresponse instead
   */
  optimisticUpdate?(...args: Parameters<F>): ResolveType<F>;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  getOptimisticResponse?(
    snap: SnapshotInterface,
    ...args: Parameters<F>
  ): ResolveType<F>;
  /** Determines whether to throw or fallback to */
  errorPolicy?(error: any): 'soft' | undefined;
  /** User-land extra data to send */
  readonly extra?: any;
}
export type FetchFunction<A extends readonly any[] = any, R = any> = (
  ...args: A
) => Promise<R>;

/** @deprecated */
export type SimpleFetchFunction<P = any, B = any, R = any> = (
  ...args: readonly [params?: P, body?: B, ...rest: any]
) => Promise<R>;

export type OptimisticUpdateParams<
  SourceSchema extends Schema | undefined,
  Dest extends EndpointInterface<FetchFunction, Schema, any>,
> = [
  Dest,
  Parameters<Dest>[0],
  UpdateFunction<SourceSchema, Exclude<Dest['schema'], undefined>>,
];

export type UpdateFunction<
  SourceSchema extends Schema | undefined,
  DestSchema extends Schema,
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

export * from './ErrorTypes';
export { default as SnapshotInterface } from './SnapshotInterface';
