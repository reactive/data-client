import { schema, Schema } from '@rest-hooks/normalizr';
import { Normalize } from '@rest-hooks/endpoint/normal';
import { EndpointInterface } from '@rest-hooks/endpoint/interface';
import { ResolveType } from '@rest-hooks/endpoint/utility';
import SnapshotInterface from '@rest-hooks/endpoint/SnapshotInterface';

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
  readonly optimisticUpdate?: (...args: Parameters<F>) => ResolveType<F>;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  readonly getOptimisticResponse?: (
    snap: SnapshotInterface,
    ...args: Parameters<F>
  ) => ResolveType<F>;
  /** Determines whether to throw or fallback to */
  readonly errorPolicy?: (error: any) => 'soft' | undefined;
  /** User-land extra data to send */
  readonly extra?: any;
}

export type FetchFunction<P = any, B = any, R = any> = (
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

export * from '@rest-hooks/endpoint/ErrorTypes';
export { default as SnapshotInterface } from '@rest-hooks/endpoint/SnapshotInterface';
