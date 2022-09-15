import type { FetchFunction } from './types.js';
import type { Denormalize } from '../types.js';
import type { Schema } from '../interface.js';

/** What the function's promise resolves to */
export type ResolveType<E extends (...args: any) => any> =
  ReturnType<E> extends Promise<infer R> ? R : never;

/** Fallback to schema if fetch function isn't defined */
export type InferReturn<
  F extends FetchFunction,
  S extends Schema | undefined,
> = S extends undefined
  ? ReturnType<F>
  : ReturnType<F> extends unknown
  ? Promise<Denormalize<S>>
  : ReturnType<F>;
