import { FetchOptions } from '@rest-hooks/core/types';
import { Entity, Schema } from '@rest-hooks/normalizr';

/** Defines the shape of a network request */
export interface FetchShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void =
    | Readonly<object | string>
    | undefined,
  Response = any
> {
  readonly type: 'read' | 'mutate' | 'delete';
  fetch(params: Params, body: Body): Promise<Response>;
  getFetchKey(params: Params): string;
  readonly schema: S;
  readonly options?: FetchOptions;
}

/** Purges a value from the server */
export interface DeleteShape<
  S extends Entity,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = undefined,
  Response = any
> extends FetchShape<S, Params, Body, Response> {
  readonly type: 'delete';
}

/** To change values on the server */
export interface MutateShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void =
    | Readonly<object | string>
    | undefined,
  Response extends object | string | number | boolean | null = any
> extends FetchShape<S, Params, Body, Response> {
  readonly type: 'mutate';
  fetch(params: Params, body: Body): Promise<Response>;
}

/** For retrieval requests */
export interface ReadShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Response extends object | string | number | boolean | null = any
> extends FetchShape<S, Params, undefined, Response> {
  readonly type: 'read';
  fetch(params: Params): Promise<Response>;
}
