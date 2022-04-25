import { schema, Schema } from '@rest-hooks/normalizr';

import { Normalize } from './normal.js';
import { EndpointInterface } from './interface.js';
import { ResolveType } from './utility.js';
export interface EndpointExtraOptions<F extends FetchFunction = FetchFunction> {
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  readonly optimisticUpdate?: (...args: Parameters<F>) => ResolveType<F>;
  /** User-land extra data to send */
  readonly extra?: any;
}
export declare type FetchFunction<P = any, B = any, R = any> = (
  params?: P,
  body?: B,
) => Promise<R>;
export declare type OptimisticUpdateParams<
  SourceSchema extends Schema | undefined,
  Dest extends EndpointInterface<FetchFunction, Schema, any>,
> = [
  Dest,
  Parameters<Dest>[0],
  UpdateFunction<SourceSchema, Exclude<Dest['schema'], undefined>>,
];
export declare type UpdateFunction<
  SourceSchema extends Schema | undefined,
  DestSchema extends Schema,
> = (
  sourceResults: Normalize<SourceSchema>,
  destResults: Normalize<DestSchema> | undefined,
) => Normalize<DestSchema>;
export declare type SchemaDetail<T> =
  | schema.EntityInterface<T>
  | {
      [K: string]: any;
    }
  | schema.SchemaClass;
export declare type SchemaList<T> =
  | schema.EntityInterface<T>[]
  | {
      [K: string]: any;
    }
  | Schema[]
  | schema.SchemaClass;
//# sourceMappingURL=types.d.ts.map
