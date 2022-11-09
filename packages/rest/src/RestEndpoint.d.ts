/* eslint-disable @typescript-eslint/ban-types */
import type {
  EndpointExtraOptions,
  EndpointInstanceInterface,
  Schema,
  FetchFunction,
  ResolveType,
} from '@rest-hooks/endpoint';

import { PathArgs } from './pathTypes.js';

export interface RestInstance<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = any,
  M extends true | undefined = true | undefined,
> extends EndpointInstanceInterface<F, S, M> {
  /** Pattern to construct url based on Url Parameters
   * @see https://resthooks.io/rest/api/RestEndpoint#path
   */
  readonly path: string;
  /** Prepended to all urls
   * @see https://resthooks.io/rest/api/RestEndpoint#urlPrefix
   */
  readonly urlPrefix: string;
  readonly requestInit: RequestInit;
  readonly method: string;
  readonly signal: AbortSignal | undefined;

  /* fetch lifecycles */
  /* before-fetch */
  url(...args: Parameters<F>): string;
  /** @see https://resthooks.io/rest/api/RestEndpoint#getRequestInit */
  getRequestInit(
    this: any,
    body?: RequestInit['body'] | Record<string, unknown>,
  ): RequestInit;
  /** @see https://resthooks.io/rest/api/RestEndpoint#getHeaders */
  getHeaders(headers: HeadersInit): HeadersInit;
  /* after-fetch */
  /** @see https://resthooks.io/rest/api/RestEndpoint#fetchResponse */
  fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
  /** @see https://resthooks.io/rest/api/RestEndpoint#parseResponse */
  parseResponse(response: Response): Promise<any>;
  /** @see https://resthooks.io/rest/api/RestEndpoint#process */
  process(value: any, ...args: Parameters<F>): ResolveType<F>;

  /* extenders */
  paginated<
    E extends RestInstance<FetchFunction, Schema | undefined, undefined>,
    A extends any[],
  >(
    this: E,
    removeCursor: (...args: A) => readonly [...Parameters<E>],
  ): PaginationEndpoint<E, A>;
  extend<E extends RestInstance, O extends PartialRestGenerics | {}>(
    this: E,
    options: Readonly<RestEndpointExtendOptions<O, E, F> & O>,
  ): RestExtendedEndpoint<O, E>;
}

export type RestEndpointExtendOptions<
  O extends PartialRestGenerics | {},
  E extends RestInstance,
  F extends FetchFunction,
> = RestEndpointOptions<OptionsToFunction<O, E, F>> &
  Partial<Omit<E, keyof RestInstance>>;

type OptionsToFunction<
  O extends PartialRestGenerics,
  E extends RestInstance,
  F extends FetchFunction,
> = 'path' extends keyof O
  ? RestType<
      'searchParams' extends keyof O
        ? O['searchParams'] & PathArgs<Exclude<O['path'], undefined>>
        : PathArgs<Exclude<O['path'], undefined>>,
      'body' extends keyof O ? O['body'] : undefined,
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>
    >
  : 'body' extends keyof O
  ? RestType<
      UrlParamsFromFunction<Parameters<E>>,
      O['body'],
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>
    >
  : F;
type UrlParamsFromFunction<Args extends any[]> = 1 extends keyof Args
  ? Args[0]
  : undefined;

export type RestExtendedEndpoint<
  O extends PartialRestGenerics,
  E extends RestInstance,
> = OptionsToFunction<
  O,
  E,
  RestInstance<
    (
      ...args: Parameters<E>
    ) => O['process'] extends {}
      ? Promise<ReturnType<O['process']>>
      : ReturnType<E>,
    'schema' extends keyof O ? O['schema'] : E['schema'],
    'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect']
  >
> &
  Omit<O, KeyofRestEndpoint | 'body' | 'searchParams'> &
  Omit<E, KeyofRestEndpoint>;

export interface PartialRestGenerics {
  readonly path?: string;
  readonly schema?: Schema | undefined;
  readonly method?: string;
  /** Only used for types */
  readonly body?: any;
  /** Only used for types */
  readonly searchParams?: any;
  /** @see https://resthooks.io/rest/api/RestEndpoint#process */
  process?(value: any, ...args: any): any;
}
export interface RestGenerics extends PartialRestGenerics {
  readonly path: string;
}

export type PaginationEndpoint<
  E extends RestInstance,
  A extends any[],
> = RestInstance<
  ParamFetchNoBody<A[0], ResolveType<E>>,
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
  fetch?: F;
  urlPrefix?: string;
  requestInit?: RequestInit;
  key?(...args: Parameters<F>): string;
  sideEffect?: true | undefined;
  name?: string;
  signal?: AbortSignal;
  url?(...args: Parameters<F>): string;
  getHeaders?(headers: HeadersInit): HeadersInit;
  getRequestInit?(body: any): RequestInit;
  fetchResponse?(input: RequestInfo, init: RequestInit): Promise<any>;
  parseResponse?(response: Response): Promise<any>;
  update?(...args: any): any;
}

export type RestEndpointConstructorOptions<O extends RestGenerics = any> =
  RestEndpointOptions<
    RestFetch<
      'searchParams' extends keyof O
        ? O['searchParams'] & PathArgs<O['path']>
        : PathArgs<O['path']>,
      BodyDefault<O>,
      O['process'] extends {}
        ? ReturnType<O['process']>
        : any /*Denormalize<O['schema']>*/
    >
  >;

export interface RestEndpointConstructor {
  new <O extends RestGenerics = any>({
    method,
    sideEffect,
    name,
    ...options
  }: Readonly<RestEndpointConstructorOptions<O> & O>): RestInstance<
    RestFetch<
      'searchParams' extends keyof O
        ? O['searchParams'] & PathArgs<O['path']>
        : PathArgs<O['path']>,
      BodyDefault<O>,
      O['process'] extends {}
        ? ReturnType<O['process']>
        : any /*Denormalize<O['schema']>*/
    >,
    O['schema'] extends Schema | undefined ? O['schema'] : undefined,
    MethodToSide<O['method']>
  >;
  readonly prototype: RestInstance;
}
/** Simplifies endpoint definitions that follow REST patterns
 *
 * @see https://resthooks.io/rest/api/RestEndpoint
 */
export declare let RestEndpoint: RestEndpointConstructor;
export default RestEndpoint;

export type MethodToSide<M> = M extends string
  ? M extends 'GET'
    ? undefined
    : true
  : undefined;

/** RestEndpoint types simplified */
export type RestType<
  UrlParams = any,
  Body = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  R = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
> = Body extends {}
  ? RestTypeWithBody<UrlParams, S, M, Body, R>
  : RestTypeNoBody<UrlParams, S, M, R>;

export type RestTypeWithBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  Body extends BodyInit | Record<string, any> = any,
  R = any /*Denormalize<S>*/,
> = RestInstance<ParamFetchWithBody<UrlParams, Body, R>, S, M>;

export type RestTypeNoBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  R = any /*Denormalize<S>*/,
> = RestInstance<ParamFetchNoBody<UrlParams, R>, S, M>;

/** Simple parameters, and body fetch functions */
export type RestFetch<
  UrlParams,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Body = {},
  Resolve = any,
> = Body extends Record<string, unknown>
  ? ParamFetchWithBody<UrlParams, Body, Resolve>
  : ParamFetchNoBody<UrlParams, Resolve>;

export type ParamFetchWithBody<
  P,
  B extends {} = {},
  R = any,
> = keyof P extends undefined
  ? (this: EndpointInstanceInterface, body: B) => Promise<R>
  : undefined extends P
  ? (this: EndpointInstanceInterface, body: B) => Promise<R>
  : (this: EndpointInstanceInterface, params: P, body: B) => Promise<R>;

export type ParamFetchNoBody<P, R = any> = /*string extends keyof P
  ? (this: EndpointInstanceInterface, params?: P) => Promise<R>
  :*/ P extends undefined
  ? (this: EndpointInstanceInterface) => Promise<R>
  : undefined extends P
  ? (this: EndpointInstanceInterface) => Promise<R>
  : (this: EndpointInstanceInterface, params: P) => Promise<R>;

export type KeyofRestEndpoint = keyof RestInstance;

export type FromFallBack<K extends keyof E, O, E> = K extends keyof O
  ? O[K]
  : E[K];

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
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
> = RestTypeNoBody<UrlParams, S, undefined>;

export type MutateEndpoint<
  UrlParams = any,
  Body extends BodyInit | Record<string, any> = any,
  S extends Schema | undefined = Schema | undefined,
> = RestTypeWithBody<UrlParams, S, true, Body>;

export type Defaults<O, D> = {
  [K in keyof O | keyof D]: K extends keyof O
    ? Exclude<O[K], undefined>
    : D[Extract<K, keyof D>];
};
