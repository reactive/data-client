import { Schema, EndpointExtraOptions } from '@rest-hooks/endpoint';

/** Defines the shape of a network request */
export interface FetchShape<
  S extends Schema | undefined,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void | unknown =
    | Readonly<object | string>
    | undefined,
  Response = any,
> {
  readonly type: 'read' | 'mutate' | 'delete';
  fetch(params: Params, body?: Body): Promise<Response>;
  getFetchKey(params: Params): string;
  readonly schema: S;
  readonly options?: EndpointExtraOptions;
}

/** To change values on the server */
export interface MutateShape<
  S extends Schema | undefined,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void | unknown =
    | Readonly<object | string>
    | undefined,
  Response extends object | string | number | boolean | null = any,
> extends FetchShape<S, Params, Body, Response> {
  readonly type: 'mutate';
  fetch(params: Params, body: Body): Promise<Response>;
}

/** Removes entities */
export interface DeleteShape<
  S extends Schema | undefined,
  Params extends Readonly<object> = Readonly<object>,
  Response extends object | string | number | boolean | null = any,
> extends FetchShape<S, Params, undefined, Response> {
  readonly type: 'mutate';
  fetch(params: Params, ...args: any): Promise<Response>;
}

/** For retrieval requests */
export interface ReadShape<
  S extends Schema | undefined,
  Params extends Readonly<object> = Readonly<object>,
  Response extends object | string | number | boolean | null = any,
> extends FetchShape<S, Params, undefined, Response> {
  readonly type: 'read';
  fetch(params: Params): Promise<Response>;
}
