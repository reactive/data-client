import type { Schema } from './interface.js';
import type { SetValue } from './setTypes.js';
import { SnapshotInterface } from './SnapshotInterface.js';
import { ResolveType } from './utility.js';

export * from './utility.js';
export * from './ErrorTypes.js';

export type FetchFunction<A extends readonly any[] = any, R = any> = (
  ...args: A
) => Promise<R>;

export interface EndpointExtraOptions<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = undefined,
> {
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Determines whether to throw or fallback to */
  errorPolicy?(error: any): 'hard' | 'soft' | undefined;

  /** Enables optimistic updates for this request - uses return value as assumed network response */
  getOptimisticResponse?(
    snap: SnapshotInterface,
    ...args: Parameters<F>
  ): OptimisticResponse<F, S>;
  /** User-land extra data to send */
  readonly extra?: any;
}

/** What getOptimisticResponse() returns: the fetch's resolved type, or when that is `any`
 * (no `process()`), the raw input the schema normalizes, like a `Controller.set()` value */
export type OptimisticResponse<F extends FetchFunction, S> =
  undefined extends S ? ResolveType<F>
  : 0 extends 1 & ResolveType<F> ? SetValue<S>
  : ResolveType<F>;
