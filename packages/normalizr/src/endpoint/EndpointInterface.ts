import { Schema } from '../interface.js';
import { InferReturn } from './utility.js';
import type { FetchFunction } from './types.js';
import { Normalize } from '../types.js';
import { ResolveType } from './utility.js';
import { SnapshotInterface } from './SnapshotInterface.js';

/** Defines a networking endpoint */
export interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointExtraOptions<F> {
  (...args: Parameters<F>): InferReturn<F, S>;
  key(...args: Parameters<F>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}

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

/** To change values on the server */
export interface MutateEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
> extends EndpointInterface<F, S, true> {
  sideEffect: true;
}

/** For retrieval requests */
export type ReadEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
> = EndpointInterface<F, S, undefined>;
