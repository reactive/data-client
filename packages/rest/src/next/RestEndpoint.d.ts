/* eslint-disable @typescript-eslint/ban-types */
import type {
  EndpointExtraOptions,
  EndpointInstanceInterface,
  Schema,
  FetchFunction,
  ResolveType,
} from '@rest-hooks/endpoint';

import { OptionsToFunction } from './OptionsToFunction.js';
import type { ExtractCollection } from '../extractCollection.js';
import { PathArgs } from '../pathTypes.js';
import { EndpointUpdateFunction } from '../RestEndpointTypeHelp.js';
import { RequiredKeys } from '../utiltypes.js';

export interface RestInstanceBase<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = any,
  M extends true | undefined = true | undefined,
  O extends {
    path: string;
    body?: any;
    searchParams?: any;
  } = { path: string },
> extends EndpointInstanceInterface<F, S, M> {
  readonly body?: 'body' extends keyof O ? O['body'] : any;
  readonly searchParams?: 'searchParams' extends keyof O
    ? O['searchParams']
    : // unknown is identity with '&' type operator
      unknown;

  /** Pattern to construct url based on Url Parameters
   * @see https://resthooks.io/rest/api/RestEndpoint#path
   */
  readonly path: O['path'];
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
  ): Promise<RequestInit> | RequestInit;
  /** @see https://resthooks.io/rest/api/RestEndpoint#getHeaders */
  getHeaders(headers: HeadersInit): Promise<HeadersInit> | HeadersInit;
  /* after-fetch */
  /** @see https://resthooks.io/rest/api/RestEndpoint#fetchResponse */
  fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
  /** @see https://resthooks.io/rest/api/RestEndpoint#parseResponse */
  parseResponse(response: Response): Promise<any>;
  /** @see https://resthooks.io/rest/api/RestEndpoint#process */
  process(value: any, ...args: Parameters<F>): ResolveType<F>;

  /* utilities */
  /** @see https://resthooks.io/rest/api/RestEndpoint#testKey */
  testKey(key: string): boolean;

  /* extenders */
  // TODO: figure out better way than wrapping whole options in Readonly<> + making O extend from {}
  //       this is just a hack to handle when no members of PartialRestGenerics are present
  //       Note: Using overloading (like paginated did) struggles because typescript does not have a clear way of distinguishing one
  //       should be used from the other (due to same problem with every member being partial)
  extend<E extends RestInstanceBase, O extends PartialRestGenerics | {}>(
    this: E,
    options: Readonly<RestEndpointExtendOptions<O, E, F> & O>,
  ): RestExtendedEndpoint<O, E>;
  paginated<
    E extends RestInstanceBase<FetchFunction, any, undefined>,
    A extends any[],
  >(
    this: E,
    removeCursor: (...args: A) => readonly [...Parameters<E>],
  ): PaginationEndpoint<E, A>;
  paginated<
    E extends RestInstanceBase<FetchFunction, any, undefined>,
    C extends string,
  >(
    this: E,
    cursorField: C,
  ): PaginationFieldEndpoint<E, C>;
}

export interface RestInstance<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = any,
  M extends true | undefined = true | undefined,
  O extends {
    path: string;
    body?: any;
    searchParams?: any;
  } = { path: string },
> extends RestInstanceBase<F, S, M, O> {
  push: AddEndpoint<F, S, O>;
  unshift: AddEndpoint<F, S, O>;
  assign: AddEndpoint<F, S, O>;
}

export type RestEndpointExtendOptions<
  O extends PartialRestGenerics,
  E extends RestInstanceBase,
  F extends FetchFunction,
> = RestEndpointOptions<
  OptionsToFunction<O, E, F>,
  'schema' extends keyof O
    ? Extract<O['schema'], Schema | undefined>
    : E['schema']
> &
  Partial<Omit<E, KeyofRestEndpoint | keyof PartialRestGenerics>>;

type OptionsToRestEndpoint<
  O extends PartialRestGenerics,
  E extends RestInstanceBase & { body?: any },
  F extends FetchFunction,
> = 'path' extends keyof O
  ? RestType<
      'searchParams' extends keyof O
        ? O['searchParams'] & PathArgs<Exclude<O['path'], undefined>>
        : PathArgs<Exclude<O['path'], undefined>>,
      'body' extends keyof O ? O['body'] : E['body'],
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>,
      {
        path: Exclude<O['path'], undefined>;
        body: 'body' extends keyof O ? O['body'] : E['body'];
        searchParams: 'searchParams' extends keyof O
          ? O['searchParams']
          : E['searchParams'];
      }
    >
  : 'body' extends keyof O
  ? RestType<
      'searchParams' extends keyof O
        ? O['searchParams'] & PathArgs<Exclude<E['path'], undefined>>
        : PathArgs<Exclude<E['path'], undefined>>,
      O['body'],
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>,
      {
        path: E['path'];
        body: O['body'];
        searchParams: 'searchParams' extends keyof O
          ? O['searchParams']
          : E['searchParams'];
      }
    >
  : 'searchParams' extends keyof O
  ? RestType<
      O['searchParams'] & PathArgs<Exclude<E['path'], undefined>>,
      E['body'],
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>,
      {
        path: E['path'];
        body: E['body'];
        searchParams: O['searchParams'];
      }
    >
  : RestInstance<
      F,
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      {
        path: 'path' extends keyof O
          ? Exclude<O['path'], undefined>
          : E['path'];
        body: 'body' extends keyof O ? O['body'] : E['body'];
        searchParams: 'searchParams' extends keyof O
          ? O['searchParams']
          : E['searchParams'];
      }
    >;

export type RestExtendedEndpoint<
  O extends PartialRestGenerics,
  E extends RestInstanceBase,
> = OptionsToRestEndpoint<
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
  Omit<O, KeyofRestEndpoint> &
  Omit<E, KeyofRestEndpoint | keyof O>;

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
  E extends RestInstanceBase,
  A extends any[],
> = RestInstance<
  ParamFetchNoBody<A[0], ResolveType<E>>,
  E['schema'],
  E['sideEffect'],
  Pick<E, 'path' | 'searchParams' | 'body'> & {
    searchParams: Omit<A[0], keyof PathArgs<E['path']>>;
  }
>;
export type PaginationFieldEndpoint<
  E extends RestInstanceBase,
  C extends string,
> = RestInstance<
  ParamFetchNoBody<
    { [K in C]: string | number | boolean } & E['searchParams'] &
      PathArgs<Exclude<E['path'], undefined>>,
    ResolveType<E>
  >,
  E['schema'],
  E['sideEffect'],
  Pick<E, 'path' | 'searchParams' | 'body'> & {
    searchParams: { [K in C]: string | number | boolean } & E['searchParams'];
  }
>;
export type AddEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = any,
  O extends {
    path: string;
    body?: any;
    searchParams?: any;
  } = { path: string },
> = RestInstanceBase<
  RestFetch<
    'searchParams' extends keyof O
      ? O['searchParams'] & PathArgs<Exclude<O['path'], undefined>>
      : PathArgs<Exclude<O['path'], undefined>>,
    any,
    ReturnType<F>
  >,
  ExtractCollection<S>,
  true,
  Omit<O, 'body'>
> & { method: 'POST' };

export type BodyDefault<O extends RestGenerics> = 'body' extends keyof O
  ? O['body']
  : O['method'] extends 'POST' | 'PUT' | 'PATCH'
  ? Record<string, unknown> | FormData
  : undefined;

type OptionsBodyDefault<O extends RestGenerics> = 'body' extends keyof O
  ? O
  : O['method'] extends 'POST' | 'PUT' | 'PATCH'
  ? O & { body: any }
  : O & { body: undefined };

export interface RestEndpointOptions<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = undefined,
> extends EndpointExtraOptions<F> {
  urlPrefix?: string;
  requestInit?: RequestInit;
  getHeaders?(headers: HeadersInit): Promise<HeadersInit> | HeadersInit;
  getRequestInit?(body: any): Promise<RequestInit> | RequestInit;
  fetchResponse?(input: RequestInfo, init: RequestInit): Promise<any>;
  parseResponse?(response: Response): Promise<any>;

  sideEffect?: true | undefined;
  name?: string;
  signal?: AbortSignal;
  fetch?: F;
  key?(...args: Parameters<F>): string;
  url?(...args: Parameters<F>): string;
  update?: EndpointUpdateFunction<F, S>;
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
    >,
    O['schema']
  >;

export interface RestEndpointConstructor {
  new <O extends RestGenerics = any>({
    method,
    sideEffect,
    name,
    ...options
  }: RestEndpointConstructorOptions<O> & Readonly<O>): RestInstance<
    RestFetch<
      'searchParams' extends keyof O
        ? O['searchParams'] & PathArgs<O['path']>
        : PathArgs<O['path']>,
      BodyDefault<O>,
      O['process'] extends {}
        ? ReturnType<O['process']>
        : any /*Denormalize<O['schema']>*/
    >,
    'schema' extends keyof O ? O['schema'] : undefined,
    MethodToSide<O['method']>,
    OptionsBodyDefault<O>
  >;
  readonly prototype: RestInstanceBase;
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
  O extends {
    path: string;
    body?: any;
    searchParams?: any;
  } = { path: string },
  // eslint-disable-next-line @typescript-eslint/ban-types
> = IfTypeScriptLooseNull<
  RestInstance<
    keyof UrlParams extends never
      ? (this: EndpointInstanceInterface, body?: Body) => Promise<R>
      : string extends keyof UrlParams
      ?
          | ((this: EndpointInstanceInterface, body?: Body) => Promise<R>)
          | ((
              this: EndpointInstanceInterface,
              params: UrlParams,
              body?: Body,
            ) => Promise<R>)
      : (
          this: EndpointInstanceInterface,
          params: UrlParams,
          body?: Body,
        ) => Promise<R>,
    S,
    M,
    O
  >,
  Body extends {}
    ? RestTypeWithBody<UrlParams, S, M, Body, R, O>
    : RestTypeNoBody<UrlParams, S, M, R, O>
>;

export type RestTypeWithBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  Body = any,
  R = any /*Denormalize<S>*/,
  O extends {
    path: string;
    body?: any;
    searchParams?: any;
  } = { path: string; body: any },
> = RestInstance<ParamFetchWithBody<UrlParams, Body, R>, S, M, O>;

export type RestTypeNoBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  R = any /*Denormalize<S>*/,
  O extends {
    path: string;
    body?: undefined;
    searchParams?: any;
  } = { path: string; body: undefined },
> = RestInstance<ParamFetchNoBody<UrlParams, R>, S, M, O>;

/** Simple parameters, and body fetch functions */
export type RestFetch<
  UrlParams,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Body = {},
  Resolve = any,
> = IfTypeScriptLooseNull<
  | ParamFetchNoBody<UrlParams, Resolve>
  | ParamFetchWithBody<UrlParams, Body, Resolve>,
  Body extends {}
    ? ParamFetchWithBody<UrlParams, Body, Resolve>
    : ParamFetchNoBody<UrlParams, Resolve>
>;

export type ParamFetchWithBody<P, B = {}, R = any> = IfTypeScriptLooseNull<
  keyof P extends never
    ? (this: EndpointInstanceInterface, body: B) => Promise<R>
    : string extends keyof P
    ?
        | ((this: EndpointInstanceInterface, body: B) => Promise<R>)
        | ((this: EndpointInstanceInterface, params: P, body: B) => Promise<R>)
    : (this: EndpointInstanceInterface, params: P, body: B) => Promise<R>,
  P extends undefined
    ? (this: EndpointInstanceInterface, body: B) => Promise<R>
    : undefined extends P
    ? (this: EndpointInstanceInterface, body: B) => Promise<R>
    : RequiredKeys<P> extends never
    ?
        | ((this: EndpointInstanceInterface, body: B) => Promise<R>)
        | ((this: EndpointInstanceInterface, params: P, body: B) => Promise<R>)
    : (this: EndpointInstanceInterface, params: P, body: B) => Promise<R>
>;

export type ParamFetchNoBody<P, R = any> = IfTypeScriptLooseNull<
  keyof P extends never
    ? (this: EndpointInstanceInterface) => Promise<R>
    : string extends keyof P
    ? (this: EndpointInstanceInterface, params?: P) => Promise<R>
    : (this: EndpointInstanceInterface, params: P) => Promise<R>,
  P extends undefined
    ? (this: EndpointInstanceInterface) => Promise<R>
    : undefined extends P
    ? (this: EndpointInstanceInterface) => Promise<R>
    : RequiredKeys<P> extends never
    ? (this: EndpointInstanceInterface, params?: P) => Promise<R>
    : (this: EndpointInstanceInterface, params: P) => Promise<R>
>;

type IfTypeScriptLooseNull<Y, N> = 1 | undefined extends 1 ? Y : N;

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

export type Defaults<O, D> = {
  [K in keyof O | keyof D]: K extends keyof O
    ? Exclude<O[K], undefined>
    : D[Extract<K, keyof D>];
};

export type GetEndpoint<
  O extends {
    readonly path: string;
    readonly schema: Schema;
    /** Only used for types */
    readonly searchParams?: any;
  } = {
    path: string;
    schema: Schema;
  },
> = RestTypeNoBody<
  'searchParams' extends keyof O
    ? O['searchParams'] & PathArgs<O['path']>
    : PathArgs<O['path']>,
  O['schema'],
  undefined,
  any,
  O & { body: undefined }
>;

export type MutateEndpoint<
  O extends {
    readonly path: string;
    readonly schema: Schema;
    /** Only used for types */
    readonly searchParams?: any;
    /** Only used for types */
    readonly body?: any;
  } = {
    path: string;
    body: any;
    schema: Schema;
  },
> = RestTypeWithBody<
  'searchParams' extends keyof O
    ? O['searchParams'] & PathArgs<O['path']>
    : PathArgs<O['path']>,
  O['schema'],
  true,
  O['body'],
  any,
  O
>;