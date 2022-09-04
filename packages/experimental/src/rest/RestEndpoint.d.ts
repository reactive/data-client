/* eslint-disable @typescript-eslint/ban-types */
import type {
  EndpointExtraOptions,
  EndpointInstanceInterface,
  Denormalize,
  Schema,
  FetchFunction,
} from '@rest-hooks/endpoint';

import { PathArgs } from './types';

export interface RestInstance<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = any,
  M extends true | undefined = true | undefined,
> extends EndpointInstanceInterface<F, S, M> {
  readonly path: string;
  readonly fetchInit: RequestInit;
  readonly method: string;
  readonly signal: AbortSignal | undefined;

  /* fetch lifecycles */
  /* before-fetch */
  url(...args: Parameters<F>): string;
  getFetchInit(
    this: any,
    body?: RequestInit['body'] | Record<string, unknown>,
  ): RequestInit;
  /* after-fetch */
  fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
  parseResponse(response: Response): Promise<any>;
  process(value: any, ...args: Parameters<F>): any;

  /* extenders */
  paginated<
    E extends RestInstance<FetchFunction, Schema | undefined, undefined>,
    A extends any[],
  >(
    this: E,
    removeCursor: (...args: A) => readonly [...Parameters<E>],
  ): PaginationEndpoint<E, A>;
  extend<
    E extends RestInstance,
    O extends RestEndpointExtendOptions<F> &
      Partial<Omit<E, keyof RestInstance>>,
  >(
    this: E,
    options: O,
  ): RestExtendedEndpoint<typeof options, E, F>;
}

export interface RestGenerics {
  path: string;
  schema?: Schema | undefined;
  method?: string;
  body?: any;
}

export type PaginationEndpoint<
  E extends RestInstance,
  A extends any[],
> = RestInstance<
  UrlRootFetchNoBody<A[0], Denormalize<E['schema']>>,
  E['schema'],
  E['sideEffect']
>;

type BodyDefault<O extends RestGenerics> = 'body' extends keyof O
  ? O['body']
  : O['method'] extends 'POST' | 'PUT' | 'PATCH'
  ? Record<string, unknown> | FormData
  : undefined;

export interface RestEndpointOptions<F extends FetchFunction = FetchFunction>
  extends EndpointExtraOptions<F> {
  key?(...args: Parameters<F>): string;
  sideEffect?: true | undefined;
  name?: string;
  process?(res: any, ...args: any): any;
  signal?: AbortSignal;
  getFetchInit?(body: any): RequestInit;
  fetchResponse?(input: RequestInfo, init: RequestInit): Promise<any>;
  parseResponse?(response: Response): Promise<any>;
  update?(...args: any): any;
}

export type RestEndpointConstructorOptions<O extends RestGenerics = any> =
  RestEndpointOptions<
    RestFetch<PathArgs<O['path']>, BodyDefault<O>, Denormalize<O['schema']>>
  >;

export interface RestEndpointExtendOptions<
  F extends FetchFunction = FetchFunction,
> extends RestEndpointOptions<F> {
  path?: string;
  schema?: Schema | undefined;
  method?: string;
  body?: any;
}

export interface RestEndpointConstructor {
  new <O extends RestGenerics = any>({
    method,
    sideEffect,
    name,
    ...options
  }: RestEndpointConstructorOptions<O> & O): RestInstance<
    RestFetch<PathArgs<O['path']>, BodyDefault<O>, Denormalize<O['schema']>>,
    O['schema'] extends Schema | undefined ? O['schema'] : undefined,
    MethodToSide<O['method']>
  >;
  readonly prototype: RestInstance;
}
export declare let RestEndpoint: RestEndpointConstructor;
export default RestEndpoint;

export type MethodToSide<M> = M extends string
  ? M extends 'GET'
    ? undefined
    : true
  : undefined;

export type RestType<
  UrlParams = any,
  Body = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  // eslint-disable-next-line @typescript-eslint/ban-types
> = Body extends {}
  ? RestTypeWithBody<UrlParams, S, M, Body>
  : RestTypeNoBody<UrlParams, S, M>;

export interface RestTypeWithBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  Body extends BodyInit | Record<string, any> = any,
  R = Denormalize<S>,
> extends RestInstance<UrlRootFetchWithBody<UrlParams, Body, R>, S, M> {
  body: Body;
}

export type RestTypeNoBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  R = Denormalize<S>,
> = RestInstance<UrlRootFetchNoBody<UrlParams, R>, S, M>;

export type UrlRootFetch<
  U,
  // eslint-disable-next-line @typescript-eslint/ban-types
  B extends {} = {},
  R = any,
> = Body extends Record<string, unknown>
  ? UrlRootFetchWithBody<U, B, R>
  : UrlRootFetchNoBody<U, R>;

export type UrlRootFetchWithBody<
  U,
  B extends {} = {},
  R = any,
> = keyof U extends never
  ? (this: EndpointInstanceInterface, body: B) => Promise<R>
  : (this: EndpointInstanceInterface, params: U, body: B) => Promise<R>;

export type UrlRootFetchNoBody<U, R = any> = string extends keyof U
  ? (this: EndpointInstanceInterface, params?: U) => Promise<R>
  : keyof U extends never
  ? (this: EndpointInstanceInterface) => Promise<R>
  : (this: EndpointInstanceInterface, params: U) => Promise<R>;

export type KeyofRestEndpoint = keyof RestInstance;

export type RestExtendedEndpoint<
  O extends RestEndpointExtendOptions<F>,
  E extends RestInstance,
  F extends FetchFunction,
> = ('path' extends keyof O
  ? RestType<
      PathArgs<Exclude<O['path'], undefined>>,
      'body' extends keyof O ? O['body'] : undefined,
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect']
    >
  : RestInstance<
      (
        ...args: Parameters<E>
      ) => 'schema' extends keyof O ? Promise<O['schema']> : ReturnType<E>,
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect']
    >) &
  Omit<O, KeyofRestEndpoint> &
  Omit<E, KeyofRestEndpoint>;

export type FromFallBack<K extends keyof E, O, E> = K extends keyof O
  ? O[K]
  : E[K];

export type RestFetch<
  UrlParams = any,
  Body = any,
  Resolve = any,
> = Body extends {}
  ? UrlRootFetchWithBody<UrlParams, Body, Resolve>
  : UrlRootFetchNoBody<UrlParams, Resolve>;

export type RestInterface<
  UrlParams = any,
  Body = any,
  S extends Schema | undefined = Schema | undefined,
  Method extends string = any,
> = Body extends {}
  ? RestInterfaceWithBody<UrlParams, S, Method, Body>
  : RestInterfaceNoBody<UrlParams, S, Method>;

export type RestInterfaceWithBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  Method extends string = string,
  Body extends BodyInit | Record<string, any> = any,
> = RestInstance<
  UrlRootFetchWithBody<UrlParams, Body, Denormalize<S>>,
  S,
  MethodToSide<Method>
>;

export type RestInterfaceNoBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  Method extends string = string,
> = RestInterface<UrlRootFetchNoBody<UrlParams, Denormalize<S>>, S, Method>;

export type FetchMutate<
  A extends readonly any[] =  // eslint-disable-next-line @typescript-eslint/ban-types
    | [any, {}]
    // eslint-disable-next-line @typescript-eslint/ban-types
    | [{}],
  R = any,
> = (this: RestInstance, ...args: A) => Promise<R>;

export type FetchGet<A extends readonly any[] = [any], R = any> = (
  this: RestInstance,
  ...args: A
) => Promise<R>;

export type GetEndpoint<
  P = any,
  S extends Schema | undefined = Schema | undefined,
> = RestTypeNoBody<P, S, undefined>;

export type MutateEndpoint<
  P = any,
  Body extends BodyInit | Record<string, any> = any,
  S extends Schema | undefined = Schema | undefined,
> = RestTypeWithBody<P, S, true, Body>;

export type Defaults<O, D> = {
  [K in keyof O | keyof D]: K extends keyof O
    ? Exclude<O[K], undefined>
    : D[Extract<K, keyof D>];
};
