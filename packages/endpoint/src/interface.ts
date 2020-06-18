import { Schema, Entity } from '@rest-hooks/normalizr';
import { EntityInterface } from 'packages/normalizr/src/schema';

import { FetchOptions } from './types';

/** Defines a networking endpoint */
export interface EndpointInterface<
  F extends (params?: any, body?: any) => Promise<any>,
  S extends Schema | undefined = undefined,
  M extends true | undefined = undefined
> extends FetchOptions {
  (...args: Parameters<F>): ReturnType<F>;
  key(parmas?: Readonly<Parameters<F>[0]>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}

/** To change values on the server */
export interface MutateEndpoint<
  F extends (params?: any, body?: any) => Promise<any>,
  S extends Schema | undefined = undefined
> extends EndpointInterface<F, S, true> {
  fetch(
    params: Readonly<Parameters<F>[0]>,
    body: Readonly<Parameters<F>[1]>,
  ): ReturnType<F>;
}

/** For retrieval requests */
export interface ReadEndpoint<
  F extends (params?: any) => Promise<any>,
  S extends Schema | undefined = undefined
> extends EndpointInterface<F, S> {
  fetch(params: Readonly<Parameters<F>[0]>): ReturnType<F>;
}

export type ArrayElement<
  ArrayType extends unknown[] | readonly unknown[]
> = ArrayType[number];

export type IndexParams<E extends typeof Entity> = {
  [K in Extract<
    ArrayElement<Exclude<E['indexes'], undefined>>,
    keyof E
  >]?: E[K];
};

export interface IndexInterface<S extends typeof Entity> {
  key(params?: Readonly<IndexParams<S>>): string;
  readonly schema: S;
}
