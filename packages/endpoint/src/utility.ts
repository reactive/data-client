import { Schema } from '@rest-hooks/normalizr';

import { Denormalize } from './normal';
import { FetchFunction } from './types';

/** What the function's promise resolves to */
export type ResolveType<E extends (...args: any) => any> =
  ReturnType<E> extends Promise<infer R> ? R : never;

/** Fallback to schema if fetch function isn't defined */
export type InferReturn<F extends FetchFunction, S extends Schema | undefined> =
  S extends undefined
    ? ReturnType<F>
    : ReturnType<F> extends unknown
    ? Promise<Denormalize<S>>
    : ReturnType<F>;

/** Get the Params type for a given Shape */
export type EndpointParam<E> = E extends (first: infer A, ...rest: any) => any
  ? A
  : E extends { key: (first: infer A, ...rest: any) => any }
  ? A
  : never;
