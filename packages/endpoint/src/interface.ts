import { Schema, AbstractInstanceType } from '@rest-hooks/normalizr';

import type {
  EndpointExtraOptions,
  FetchFunction,
  SimpleFetchFunction,
} from './types.js';
import { InferReturn } from './utility.js';

/** Defines a networking endpoint */
export interface EndpointInterface<
  F extends FetchFunction = FetchFunction<any[]>,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointExtraOptions<F> {
  (...args: Parameters<F>): InferReturn<F, S>;
  key(...args: Parameters<F>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}

/** To change values on the server */
export interface MutateEndpoint<
  F extends (params?: any, body?: any) => Promise<any> = SimpleFetchFunction,
  S extends Schema | undefined = Schema | undefined,
> extends EndpointInterface<F, S, true> {
  sideEffect: true;
}

/** For retrieval requests */
export type ReadEndpoint<
  F extends (params?: any) => Promise<any> = (params?: any) => Promise<any>,
  S extends Schema | undefined = Schema | undefined,
> = EndpointInterface<F, S, undefined>;

export type ArrayElement<ArrayType extends unknown[] | readonly unknown[]> =
  ArrayType[number];

export type IndexParams<S extends Schema> = S extends {
  indexes: readonly string[];
}
  ? {
      [K in Extract<
        ArrayElement<S['indexes']>,
        keyof AbstractInstanceType<S>
      >]?: AbstractInstanceType<S>[K];
    }
  : Readonly<object>;

export interface IndexInterface<S extends Schema = Schema, P = object> {
  key(params?: P): string;
  readonly schema: S;
}
