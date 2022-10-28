import type { SchemaClass } from './schema.js';
import type { Schema, EntityInterface } from './interface.js';
import { ResolveType } from './utility.js';
import { SnapshotInterface } from './SnapshotInterface.js';

export * from './utility.js';
export * from './ErrorTypes.js';

export type FetchFunction<A extends readonly any[] = any, R = any> = (
  ...args: A
) => Promise<R>;

// This hack is only needed for @rest-hooks/rest@5 or below
/** @deprecated */
export type SchemaDetail<T> =
  | EntityInterface<T>
  | { [K: string]: any }
  | SchemaClass;

/** @deprecated */
export type SchemaList<T> =
  | EntityInterface<T>[]
  | { [K: string]: any }
  | Schema[]
  | SchemaClass;

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
  errorPolicy?(error: any): 'hard' | 'soft' | undefined;
  /** User-land extra data to send */
  readonly extra?: any;
}
