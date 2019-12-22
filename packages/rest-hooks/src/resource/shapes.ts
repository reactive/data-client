import { schemas, Schema } from './normal';

import { FetchOptions } from '~/types';

/** Defines the shape of a network request */
export interface FetchShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void =
    | Readonly<object | string>
    | undefined
> {
  readonly type: 'read' | 'mutate' | 'delete';
  fetch(params: Params, body: Body): Promise<any>;
  getFetchKey(params: Readonly<object>): string;
  readonly schema: S;
  readonly options?: FetchOptions;
}

/** Purges a value from the server */
export interface DeleteShape<
  S extends schemas.Entity,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void = undefined
> extends FetchShape<S, Params, Body> {
  readonly type: 'delete';
}

/** To change values on the server */
export interface MutateShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void =
    | Readonly<object | string>
    | undefined
> extends FetchShape<S, Params, Body> {
  readonly type: 'mutate';
  fetch(
    params: Params,
    body: Body,
  ): Promise<object | string | number | boolean>;
}

/** For retrieval requests */
export interface ReadShape<
  S extends Schema,
  Params extends Readonly<object> = Readonly<object>
> extends FetchShape<S, Params, undefined> {
  readonly type: 'read';
  fetch(params: Params): Promise<object | string | number | boolean>;
}
