import * as _rest_hooks_core from '@rest-hooks/core';
import { Manager, State as State$1, Controller, NetworkError as NetworkError$2, ActionTypes, legacyActions, __INTERNAL__, Schema as Schema$2, EndpointExtraOptions as EndpointExtraOptions$2, createReducer as createReducer$1, applyManager as applyManager$1, DenormalizeNullable as DenormalizeNullable$3, ExpiryStatus, EndpointInterface as EndpointInterface$2, FetchFunction as FetchFunction$2, ResolveType as ResolveType$2, UnknownError as UnknownError$2, Denormalize as Denormalize$3 } from '@rest-hooks/core';
export { AbstractInstanceType, ActionTypes, Controller, DefaultConnectionListener, Denormalize, DenormalizeNullable, DevToolsManager, Dispatch, EndpointExtraOptions, EndpointInterface, ExpiryStatus, FetchAction, FetchFunction, InvalidateAction, LogoutManager, Manager, Middleware, MiddlewareAPI, NetworkError, NetworkManager, Normalize, NormalizeNullable, PK, PollingSubscription, ReceiveAction, ReceiveTypes, ResetAction, ResolveType, Schema, State, SubscribeAction, SubscriptionManager, UnknownError, UnsubscribeAction, UpdateFunction, actionTypes } from '@rest-hooks/core';
import React$1, { Context } from 'react';
import * as packages_core_lib_controller_Controller from 'packages/core/lib/controller/Controller';

type AbstractInstanceType$1<T> = T extends {
    prototype: infer U;
} ? U : never;
type DenormalizeObject$1<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema$1 ? Denormalize$2<S[K]> : S[K];
};
type DenormalizeNullableObject$1<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema$1 ? DenormalizeNullable$2<S[K]> : S[K];
};
interface NestedSchemaClass$1<T = any> {
    schema: Record<string, Schema$1>;
    prototype: T;
}
interface RecordClass$1<T = any> extends NestedSchemaClass$1<T> {
    fromJS: (...args: any) => AbstractInstanceType$1<T>;
}
type DenormalizeNullableNestedSchema$1<S extends NestedSchemaClass$1> = keyof S['schema'] extends never ? S['prototype'] : string extends keyof S['schema'] ? S['prototype'] : S['prototype'] & {
    [K in keyof S['schema']]: DenormalizeNullable$2<S['schema'][K]>;
};
type DenormalizeReturnType$1<T> = T extends (input: any, unvisit: any) => [infer R, any, any] ? R : never;
type Denormalize$2<S> = S extends EntityInterface$1<infer U> ? U : S extends RecordClass$1 ? AbstractInstanceType$1<S> : S extends SchemaClass$1 ? DenormalizeReturnType$1<S['denormalize']> : S extends Serializable$1<infer T> ? T : S extends Array<infer F> ? Denormalize$2<F>[] : S extends {
    [K: string]: any;
} ? DenormalizeObject$1<S> : S;
type DenormalizeNullable$2<S> = S extends EntityInterface$1<any> ? DenormalizeNullableNestedSchema$1<S> | undefined : S extends RecordClass$1 ? DenormalizeNullableNestedSchema$1<S> : S extends SchemaClass$1 ? DenormalizeReturnType$1<S['_denormalizeNullable']> : S extends Serializable$1<infer T> ? T : S extends Array<infer F> ? Denormalize$2<F>[] | undefined : S extends {
    [K: string]: any;
} ? DenormalizeNullableObject$1<S> : S;

interface NetworkError$1 extends Error {
    status: number;
    response?: Response;
}
interface UnknownError$1 extends Error {
    status?: unknown;
    response?: unknown;
}
type ErrorTypes$2 = NetworkError$1 | UnknownError$1;

interface SnapshotInterface$1 {
    getResponse: <E extends Pick<EndpointInterface$1, 'key' | 'schema' | 'invalidIfStale'>, Args extends readonly [...Parameters<E['key']>]>(endpoint: E, ...args: Args) => {
        data: DenormalizeNullable$2<E['schema']>;
        expiryStatus: ExpiryStatusInterface$1;
        expiresAt: number;
    };
    getError: <E extends Pick<EndpointInterface$1, 'key'>, Args extends readonly [...Parameters<E['key']>]>(endpoint: E, ...args: Args) => ErrorTypes$2 | undefined;
    readonly fetchedAt: number;
}
type ExpiryStatusInterface$1 = 1 | 2 | 3;

/** Get the Params type for a given Shape */
type EndpointParam<E> = E extends (first: infer A, ...rest: any) => any ? A : E extends {
    key: (first: infer A, ...rest: any) => any;
} ? A : never;
/** What the function's promise resolves to */
type ResolveType$1<E extends (...args: any) => any> = ReturnType<E> extends Promise<infer R> ? R : never;
type PartialArray<A> = A extends [] ? [] : A extends [infer F] ? [F] | [] : A extends [infer F, ...infer Rest] ? [F] | [F, ...PartialArray<Rest>] : A extends (infer T)[] ? T[] : never;

type FetchFunction$1<A extends readonly any[] = any, R = any> = (...args: A) => Promise<R>;
interface EndpointExtraOptions$1<F extends FetchFunction$1 = FetchFunction$1> {
    /** Default data expiry length, will fall back to NetworkManager default if not defined */
    readonly dataExpiryLength?: number;
    /** Default error expiry length, will fall back to NetworkManager default if not defined */
    readonly errorExpiryLength?: number;
    /** Poll with at least this frequency in miliseconds */
    readonly pollFrequency?: number;
    /** Marks cached resources as invalid if they are stale */
    readonly invalidIfStale?: boolean;
    /** Enables optimistic updates for this request - uses return value as assumed network response
     * @deprecated use https://resthooks.io/docs/api/Endpoint#getoptimisticresponse instead
     */
    optimisticUpdate?(...args: Parameters<F>): ResolveType$1<F>;
    /** Enables optimistic updates for this request - uses return value as assumed network response */
    getOptimisticResponse?(snap: SnapshotInterface$1, ...args: Parameters<F>): ResolveType$1<F>;
    /** Determines whether to throw or fallback to */
    errorPolicy?(error: any): 'hard' | 'soft' | undefined;
    /** User-land extra data to send */
    readonly extra?: any;
}

type Schema$1 = null | string | {
    [K: string]: any;
} | Schema$1[] | SchemaSimple$1 | Serializable$1;
type Serializable$1<T extends {
    toJSON(): string;
} = {
    toJSON(): string;
}> = {
    prototype: T;
};
interface SchemaSimple$1<T = any> {
    normalize(input: any, parent: any, key: any, visit: (...args: any) => any, addEntity: (...args: any) => any, visitedEntities: Record<string, any>): any;
    denormalize(input: {}, unvisit: UnvisitFunction$1): [denormalized: T, found: boolean, suspend: boolean];
    infer(args: readonly any[], indexes: NormalizedIndex$1, recurse: (...args: any) => any, entities: EntityTable$1): any;
}
interface SchemaClass$1<T = any, N = T | undefined> extends SchemaSimple$1<T> {
    _normalizeNullable(): any;
    _denormalizeNullable(): [N, boolean, boolean];
}
interface EntityInterface$1<T = any> extends SchemaSimple$1 {
    pk(params: any, parent?: any, key?: string): string | undefined;
    readonly key: string;
    merge(existing: any, incoming: any): any;
    expiresAt?(meta: any, input: any): number;
    useIncoming?(existingMeta: any, incomingMeta: any, existing: any, incoming: any): boolean;
    indexes?: any;
    schema: Record<string, Schema$1>;
    prototype: T;
}
interface UnvisitFunction$1 {
    (input: any, schema: any): [any, boolean, boolean];
    og?: UnvisitFunction$1;
    setLocal?: (entity: any) => void;
}
interface NormalizedIndex$1 {
    readonly [entityKey: string]: {
        readonly [indexName: string]: {
            readonly [lookup: string]: string;
        };
    };
}
interface EntityTable$1 {
    [entityKey: string]: {
        [pk: string]: unknown;
    } | undefined;
}
/** Defines a networking endpoint */
interface EndpointInterface$1<F extends FetchFunction$1 = FetchFunction$1, S extends Schema$1 | undefined = Schema$1 | undefined, M extends true | undefined = true | undefined> extends EndpointExtraOptions$1<F> {
    (...args: Parameters<F>): ReturnType<F>;
    key(...args: Parameters<F>): string;
    readonly sideEffect?: M;
    readonly schema?: S;
}
/** To change values on the server */
interface MutateEndpoint<F extends FetchFunction$1 = FetchFunction$1, S extends Schema$1 | undefined = Schema$1 | undefined> extends EndpointInterface$1<F, S, true> {
    sideEffect: true;
}
/** For retrieval requests */
type ReadEndpoint<F extends FetchFunction$1 = FetchFunction$1, S extends Schema$1 | undefined = Schema$1 | undefined> = EndpointInterface$1<F, S, undefined>;

/* eslint-disable @typescript-eslint/ban-types */


interface EndpointOptions<
  F extends FetchFunction$1 = FetchFunction$1,
  S extends Schema$1 | undefined = undefined,
  M extends true | undefined = undefined,
> extends EndpointExtraOptions$1<F> {
  key?: (...args: Parameters<F>) => string;
  sideEffect?: M;
  schema?: S;
  [k: string]: any;
}

interface EndpointExtendOptions<
  F extends FetchFunction$1 = FetchFunction$1,
  S extends Schema$1 | undefined = Schema$1 | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointOptions<F, S, M> {
  fetch?: FetchFunction$1;
}

type KeyofEndpointInstance = keyof EndpointInstance<FetchFunction$1>;

type ExtendedEndpoint<
  O extends EndpointExtendOptions<F>,
  E extends EndpointInstance<
    FetchFunction$1,
    Schema$1 | undefined,
    true | undefined
  >,
  F extends FetchFunction$1,
> = EndpointInstance<
  'fetch' extends keyof O ? Exclude<O['fetch'], undefined> : E['fetch'],
  'schema' extends keyof O ? O['schema'] : E['schema'],
  'sideEffect' extends keyof O ? O['sideEffect'] : E['sideEffect']
> &
  Omit<O, KeyofEndpointInstance> &
  Omit<E, KeyofEndpointInstance>;

/**
 * Defines an async data source.
 * @see https://resthooks.io/docs/api/Endpoint
 */
interface EndpointInstance<
  F extends (...args: any) => Promise<any> = FetchFunction$1,
  S extends Schema$1 | undefined = Schema$1 | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointInstanceInterface<F, S, M> {
  extend<
    E extends EndpointInstance<
      (...args: any) => Promise<any>,
      Schema$1 | undefined,
      true | undefined
    >,
    O extends EndpointExtendOptions<F> &
      Partial<Omit<E, keyof EndpointInstance<FetchFunction$1>>> &
      Record<string, unknown>,
  >(
    this: E,
    options: Readonly<O>,
  ): ExtendedEndpoint<typeof options, E, F>;
}

/**
 * Defines an async data source.
 * @see https://resthooks.io/docs/api/Endpoint
 */
interface EndpointInstanceInterface<
  F extends FetchFunction$1 = FetchFunction$1,
  S extends Schema$1 | undefined = Schema$1 | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointInterface$1<F, S, M> {
  constructor: EndpointConstructor;

  /**
   * Calls the function, substituting the specified object for the this value of the function, and the specified array for the arguments of the function.
   * @param thisArg The object to be used as the this object.
   * @param argArray A set of arguments to be passed to the function.
   */
  apply<E extends FetchFunction$1>(
    this: E,
    thisArg: ThisParameterType<E>,
    argArray?: Parameters<E>,
  ): ReturnType<E>;

  /**
   * Calls a method of an object, substituting another object for the current object.
   * @param thisArg The object to be used as the current object.
   * @param argArray A list of arguments to be passed to the method.
   */
  call<E extends FetchFunction$1>(
    this: E,
    thisArg: ThisParameterType<E>,
    ...argArray: Parameters<E>
  ): ReturnType<E>;

  /**
   * For a given function, creates a bound function that has the same body as the original function.
   * The this object of the bound function is associated with the specified object, and has the specified initial parameters.
   * @param thisArg An object to which the this keyword can refer inside the new function.
   * @param argArray A list of arguments to be passed to the new function.
   */
  bind<E extends FetchFunction$1, P extends PartialArray<Parameters<E>>>(
    this: E,
    thisArg: ThisParameterType<E>,
    ...args: readonly [...P]
  ): EndpointInstance<
    (...args: readonly [...RemoveArray<Parameters<E>, P>]) => ReturnType<E>,
    S,
    M
  > &
    Omit<E, keyof EndpointInstance<FetchFunction$1>>;

  /** Returns a string representation of a function. */
  toString(): string;

  prototype: any;
  readonly length: number;

  // Non-standard extensions
  arguments: any;
  caller: F;

  key(...args: Parameters<F>): string;

  readonly sideEffect: M;

  readonly schema: S;

  fetch: F;

  /** The following is for compatibility with FetchShape */
  /** @deprecated */
  readonly type: M extends undefined
    ? 'read'
    : IfAny<M, any, IfTypeScriptLooseNull<'read', 'mutate'>>;

  /** @deprecated */
  getFetchKey(...args: OnlyFirst<Parameters<F>>): string;
  /** @deprecated */
  options?: EndpointExtraOptions$1<F>;
}

interface EndpointConstructor {
  new <
    F extends (
      this: EndpointInstance<FetchFunction$1> & E,
      params?: any,
      body?: any,
    ) => Promise<any>,
    S extends Schema$1 | undefined = undefined,
    M extends true | undefined = undefined,
    E extends Record<string, any> = {},
  >(
    fetchFunction: F,
    options?: EndpointOptions<F, S, M> & E,
  ): EndpointInstance<F, S, M> & E;
  readonly prototype: Function;
}
declare let Endpoint: EndpointConstructor;


type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
type IfTypeScriptLooseNull<Y, N> = 1 | undefined extends 1 ? Y : N;

type OnlyFirst<A extends unknown[]> = A extends [] ? [] : [A[0]];

type RemoveArray<Orig extends any[], Rem extends any[]> = Rem extends [
  any,
  ...infer RestRem,
]
  ? Orig extends [any, ...infer RestOrig]
    ? RemoveArray<RestOrig, RestRem>
    : never
  : Orig;

/**
 * Performant lookups by secondary indexes
 * @see https://resthooks.io/docs/api/Index
 */
declare class Index<S extends Schema$1, P = Readonly<IndexParams<S>>> {
    schema: S;
    constructor(schema: S, key?: (params: P) => string);
    key(params?: P): string;
    /** The following is for compatibility with FetchShape */
    getFetchKey: (params: P) => string;
}
type ArrayElement<ArrayType extends unknown[] | readonly unknown[]> = ArrayType[number];
type IndexParams<S extends Schema$1> = S extends {
    indexes: readonly string[];
} ? {
    [K in Extract<ArrayElement<S['indexes']>, keyof AbstractInstanceType$1<S>>]?: AbstractInstanceType$1<S>[K];
} : Readonly<object>;

declare const _default$1: React$1.NamedExoticComponent<{
    children: React$1.ReactNode;
}>;
//# sourceMappingURL=BackupBoundary.d.ts.map

interface ProviderProps {
    children: React$1.ReactNode;
    managers: Manager[];
    initialState: State$1<unknown>;
    Controller: typeof Controller;
}
/**
 * Manages state, providing all context needed to use the hooks.
 * @see https://resthooks.io/docs/api/CacheProvider
 */
declare function CacheProvider({ children, managers, initialState, Controller, }: ProviderProps): JSX.Element;
declare namespace CacheProvider {
    var defaultProps: {
        managers: Manager<_rest_hooks_core.CombinedActionTypes>[];
        initialState: State$1<unknown>;
        Controller: typeof Controller;
    };
}
//# sourceMappingURL=CacheProvider.d.ts.map

/**
 * Handles loading and error conditions of Suspense
 * @see https://resthooks.io/docs/api/AsyncBoundary
 */
declare function AsyncBoundary({ children, errorComponent, fallback, }: {
    children: React$1.ReactNode;
    fallback?: React$1.ReactNode;
    errorComponent?: React$1.ComponentType<{
        error: NetworkError$2;
    }>;
}): JSX.Element;
declare const _default: React$1.MemoExoticComponent<typeof AsyncBoundary>;
//# sourceMappingURL=AsyncBoundary.d.ts.map

interface Props<E extends NetworkError$2> {
    children: React$1.ReactNode;
    fallbackComponent: React$1.ComponentType<{
        error: E;
    }>;
}
interface State<E extends NetworkError$2> {
    error?: E;
}
/**
 * Handles any networking errors from suspense
 * @see https://resthooks.io/docs/api/NetworkErrorBoundary
 */
declare class NetworkErrorBoundary<E extends NetworkError$2> extends React$1.Component<Props<E>, State<E>> {
    static defaultProps: {
        fallbackComponent: ({ error }: {
            error: NetworkError$2;
        }) => JSX.Element;
    };
    static getDerivedStateFromError(error: NetworkError$2 | any): {
        error: NetworkError$2;
    };
    state: State<E>;
    render(): JSX.Element;
}

type Schema = null | string | {
    [K: string]: any;
} | Schema[] | SchemaSimple | Serializable;
type Serializable<T extends {
    toJSON(): string;
} = {
    toJSON(): string;
}> = {
    prototype: T;
};
interface SchemaSimple<T = any> {
    normalize(input: any, parent: any, key: any, visit: (...args: any) => any, addEntity: (...args: any) => any, visitedEntities: Record<string, any>): any;
    denormalize(input: {}, unvisit: UnvisitFunction): [denormalized: T, found: boolean, suspend: boolean];
    infer(args: readonly any[], indexes: NormalizedIndex, recurse: (...args: any) => any, entities: EntityTable): any;
}
interface SchemaClass<T = any, N = T | undefined> extends SchemaSimple<T> {
    _normalizeNullable(): any;
    _denormalizeNullable(): [N, boolean, boolean];
}
interface EntityInterface<T = any> extends SchemaSimple {
    pk(params: any, parent?: any, key?: string): string | undefined;
    readonly key: string;
    merge(existing: any, incoming: any): any;
    expiresAt?(meta: any, input: any): number;
    useIncoming?(existingMeta: any, incomingMeta: any, existing: any, incoming: any): boolean;
    indexes?: any;
    schema: Record<string, Schema>;
    prototype: T;
}
interface UnvisitFunction {
    (input: any, schema: any): [any, boolean, boolean];
    og?: UnvisitFunction;
    setLocal?: (entity: any) => void;
}
interface NormalizedIndex {
    readonly [entityKey: string]: {
        readonly [indexName: string]: {
            readonly [lookup: string]: string;
        };
    };
}
interface EntityTable {
    [entityKey: string]: {
        [pk: string]: unknown;
    } | undefined;
}

type AbstractInstanceType<T> = T extends {
    prototype: infer U;
} ? U : never;
type DenormalizeObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? Denormalize$1<S[K]> : S[K];
};
type DenormalizeNullableObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? DenormalizeNullable$1<S[K]> : S[K];
};
interface NestedSchemaClass<T = any> {
    schema: Record<string, Schema>;
    prototype: T;
}
interface RecordClass<T = any> extends NestedSchemaClass<T> {
    fromJS: (...args: any) => AbstractInstanceType<T>;
}
type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> = keyof S['schema'] extends never ? S['prototype'] : string extends keyof S['schema'] ? S['prototype'] : S['prototype'];
type DenormalizeReturnType<T> = T extends (input: any, unvisit: any) => [infer R, any, any] ? R : never;
type Denormalize$1<S> = S extends EntityInterface<infer U> ? U : S extends RecordClass ? AbstractInstanceType<S> : S extends SchemaClass ? DenormalizeReturnType<S['denormalize']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Denormalize$1<F>[] : S extends {
    [K: string]: any;
} ? DenormalizeObject<S> : S;
type DenormalizeNullable$1<S> = S extends EntityInterface<any> ? DenormalizeNullableNestedSchema<S> | undefined : S extends RecordClass ? DenormalizeNullableNestedSchema<S> : S extends SchemaClass ? DenormalizeReturnType<S['_denormalizeNullable']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Denormalize$1<F>[] | undefined : S extends {
    [K: string]: any;
} ? DenormalizeNullableObject<S> : S;

interface NetworkError extends Error {
    status: number;
    response?: Response;
}
interface UnknownError extends Error {
    status?: unknown;
    response?: unknown;
}
type ErrorTypes$1 = NetworkError | UnknownError;

/** What the function's promise resolves to */
type ResolveType<E extends (...args: any) => any> = ReturnType<E> extends Promise<infer R> ? R : never;
/** Fallback to schema if fetch function isn't defined */
type InferReturn<F extends FetchFunction, S extends Schema | undefined> = S extends undefined ? ReturnType<F> : ReturnType<F> extends unknown ? Promise<Denormalize$1<S>> : ReturnType<F>;

type ExpiryStatusInterface = 1 | 2 | 3;

interface SnapshotInterface {
    getResponse: <E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>, Args extends readonly [...Parameters<E['key']>]>(endpoint: E, ...args: Args) => {
        data: any;
        expiryStatus: ExpiryStatusInterface;
        expiresAt: number;
    };
    getError: <E extends Pick<EndpointInterface, 'key'>, Args extends readonly [...Parameters<E['key']>]>(endpoint: E, ...args: Args) => ErrorTypes$1 | undefined;
    readonly fetchedAt: number;
}

/** Defines a networking endpoint */
interface EndpointInterface<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined, M extends true | undefined = true | undefined> extends EndpointExtraOptions<F> {
    (...args: Parameters<F>): InferReturn<F, S>;
    key(...args: Parameters<F>): string;
    readonly sideEffect?: M;
    readonly schema?: S;
}
interface EndpointExtraOptions<F extends FetchFunction = FetchFunction> {
    /** Default data expiry length, will fall back to NetworkManager default if not defined */
    readonly dataExpiryLength?: number;
    /** Default error expiry length, will fall back to NetworkManager default if not defined */
    readonly errorExpiryLength?: number;
    /** Poll with at least this frequency in miliseconds */
    readonly pollFrequency?: number;
    /** Marks cached resources as invalid if they are stale */
    readonly invalidIfStale?: boolean;
    /** Enables optimistic updates for this request - uses return value as assumed network response
     * @deprecated use https://resthooks.io/docs/api/Endpoint#getoptimisticresponse instead
     */
    optimisticUpdate?(...args: Parameters<F>): ResolveType<F>;
    /** Enables optimistic updates for this request - uses return value as assumed network response */
    getOptimisticResponse?(snap: SnapshotInterface, ...args: Parameters<F>): ResolveType<F>;
    /** Determines whether to throw or fallback to */
    errorPolicy?(error: any): 'hard' | 'soft' | undefined;
    /** User-land extra data to send */
    readonly extra?: any;
}

type FetchFunction<A extends readonly any[] = any, R = any> = (...args: A) => Promise<R>;

/** This file exists to keep compatibility with SchemaDetail, and SchemaList type hacks
 * Support can be dropped once @rest-hooks/rest@5 support is dropped
 */

type Denormalize<S> = Extract<S, EntityInterface> extends never ? Extract<S, EntityInterface[]> extends never ? Denormalize$1<S> : Denormalize$1<Extract<S, EntityInterface[]>> : Denormalize$1<Extract<S, EntityInterface>>;
type DenormalizeNullable<S> = Extract<S, EntityInterface> extends never ? Extract<S, EntityInterface[]> extends never ? DenormalizeNullable$1<S> : DenormalizeNullable$1<Extract<S, EntityInterface[]>> : DenormalizeNullable$1<Extract<S, EntityInterface>>;

/**
 * Ensure an endpoint is available.
 * Suspends until it is.
 *
 * `useSuspense` guarantees referential equality globally.
 * @see https://resthooks.io/docs/api/useSuspense
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
declare function useSuspense<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): Args extends [null] ? E['schema'] extends Exclude<Schema, null> ? DenormalizeNullable<E['schema']> : undefined : E['schema'] extends Exclude<Schema, null> ? Denormalize<E['schema']> : ResolveType<E>;

/**
 * Request a resource if it is not in cache.
 * @see https://resthooks.io/docs/api/useFetch
 */
declare function useFetch<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): ReturnType<E> | undefined;

type CondNull$1<P, A, B> = P extends null ? A : B;
type StatefulReturn<S extends Schema | undefined, P> = CondNull$1<P, {
    data: DenormalizeNullable<S>;
    loading: false;
    error: undefined;
}, {
    data: Denormalize<S>;
    loading: false;
    error: undefined;
} | {
    data: DenormalizeNullable<S>;
    loading: true;
    error: undefined;
} | {
    data: DenormalizeNullable<S>;
    loading: false;
    error: ErrorTypes$1;
}>;
/**
 * Use async date with { data, loading, error } (DLE)
 * @see https://resthooks.io/docs/api/useDLE
 */
declare function useDLE<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): E['schema'] extends undefined ? {
    data: E extends (...args: any) => any ? ResolveType<E> | undefined : any;
    loading: boolean;
    error: ErrorTypes$1 | undefined;
} : StatefulReturn<E['schema'], Args[0]>;

/**
 * Imperative control of Rest Hooks store
 * @see https://resthooks.io/docs/api/useController
 */
declare function useController(): Controller;

/**
 * Ensure an endpoint is available. Keeps it fresh once it is.
 *
 * useSuspense() + useSubscription()
 * @see https://resthooks.io/docs/api/useLive
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
declare function useLive<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): Args extends [null] ? E['schema'] extends Exclude<Schema, null> ? DenormalizeNullable<E['schema']> : undefined : E['schema'] extends Exclude<Schema, null> ? Denormalize<E['schema']> : ResolveType<E>;

declare const StateContext: Context<State$1<unknown>>;
/** @deprecated use Controller.dispatch */
declare const DispatchContext: Context<(value: ActionTypes) => Promise<void>>;
declare const ControllerContext: Context<Controller<packages_core_lib_controller_Controller.CompatibleDispatch>>;
interface Store<S> {
    subscribe(listener: () => void): () => void;
    dispatch: React.Dispatch<ActionTypes>;
    getState(): S;
    uninitialized?: boolean;
}
declare const StoreContext: Context<Store<State$1<unknown>>>;

/** @deprecated use Controller.dispatch */
declare const createFetch$1: typeof legacyActions.createFetch;
/** @deprecated use Controller.dispatch */
declare const createReceive$1: typeof legacyActions.createReceive;
/** @deprecated use Controller.dispatch */
declare const createReceiveError$1: typeof legacyActions.createReceiveError;
declare const inferResults$1: typeof __INTERNAL__.inferResults;

/** Turns a dispatch function into one that resolves once its been commited */
declare function usePromisifiedDispatch<R extends React$1.Reducer<any, any>>(dispatch: React$1.Dispatch<React$1.ReducerAction<R>>, state: React$1.ReducerState<R>): (action: React$1.ReducerAction<R>) => Promise<void>;

/** Defines the shape of a network request */
interface FetchShape<S extends Schema$2 | undefined, Params extends Readonly<object> = Readonly<object>, Body extends Readonly<object | string> | void | unknown = Readonly<object | string> | undefined, Response = any> {
    readonly type: 'read' | 'mutate' | 'delete';
    fetch(params: Params, body?: Body): Promise<Response>;
    getFetchKey(params: Params): string;
    readonly schema: S;
    readonly options?: EndpointExtraOptions$2;
}
/** To change values on the server */
interface MutateShape<S extends Schema$2 | undefined, Params extends Readonly<object> = Readonly<object>, Body extends Readonly<object | string> | void | unknown = Readonly<object | string> | undefined, Response extends object | string | number | boolean | null = any> extends FetchShape<S, Params, Body, Response> {
    readonly type: 'mutate';
    fetch(params: Params, body: Body): Promise<Response>;
}
/** Removes entities */
interface DeleteShape<S extends Schema$2 | undefined, Params extends Readonly<object> = Readonly<object>, Response extends object | string | number | boolean | null = any> extends FetchShape<S, Params, undefined, Response> {
    readonly type: 'mutate';
    fetch(params: Params, ...args: any): Promise<Response>;
}
/** For retrieval requests */
interface ReadShape<S extends Schema$2 | undefined, Params extends Readonly<object> = Readonly<object>, Response extends object | string | number | boolean | null = any> extends FetchShape<S, Params, undefined, Response> {
    readonly type: 'read';
    fetch(params: Params): Promise<Response>;
}

/** Sets a FetchShape's Param type.
 * Useful to constrain acceptable params (second arg) in hooks like useResource().
 *
 * @param [Shape] FetchShape to act upon
 * @param [Params] what to set the Params to
 */
type SetShapeParams<Shape extends FetchShape<any, any, any>, Params extends Readonly<object>> = {
    [K in keyof Shape]: Shape[K];
} & (Shape['fetch'] extends (first: any, ...rest: infer Args) => infer Return ? {
    fetch: (first: Params, ...rest: Args) => Return;
} : never);
/** Get the Params type for a given Shape */
type ParamsFromShape<S> = S extends {
    fetch: (first: infer A, ...rest: any) => any;
} ? A : S extends {
    getFetchKey: (first: infer A, ...rest: any) => any;
} ? A : never;

declare function makeCacheProvider(managers: Manager[], initialState?: State$1<unknown>, act?: Act): (props: {
    children: React$1.ReactNode;
}) => JSX.Element;
type Act = {
    (callback: () => Promise<void | undefined>): Promise<undefined>;
    (callback: () => void | undefined): void;
};

declare const createFetch: typeof createFetch$1;
declare const createReceive: typeof createReceive$1;
declare const createReceiveError: typeof createReceiveError$1;
declare const initialState: State$1<unknown>;
declare const DELETED: symbol;
declare const inferResults: typeof inferResults$1;
declare const createReducer: typeof createReducer$1;
declare const applyManager: typeof applyManager$1;
declare const useCacheState: () => State$1<unknown>;

declare const internal_d_createFetch: typeof createFetch;
declare const internal_d_createReceive: typeof createReceive;
declare const internal_d_createReceiveError: typeof createReceiveError;
declare const internal_d_initialState: typeof initialState;
declare const internal_d_DELETED: typeof DELETED;
declare const internal_d_inferResults: typeof inferResults;
declare const internal_d_createReducer: typeof createReducer;
declare const internal_d_applyManager: typeof applyManager;
declare const internal_d_useCacheState: typeof useCacheState;
declare const internal_d_StateContext: typeof StateContext;
declare const internal_d_DispatchContext: typeof DispatchContext;
declare namespace internal_d {
  export {
    internal_d_createFetch as createFetch,
    internal_d_createReceive as createReceive,
    internal_d_createReceiveError as createReceiveError,
    internal_d_initialState as initialState,
    internal_d_DELETED as DELETED,
    internal_d_inferResults as inferResults,
    internal_d_createReducer as createReducer,
    internal_d_applyManager as applyManager,
    internal_d_useCacheState as useCacheState,
    internal_d_StateContext as StateContext,
    internal_d_DispatchContext as DispatchContext,
  };
}

/**
 * @deprecated use https://resthooks.io/docs/api/Controller#getResponse directly instead
 *
 * Selects the denormalized form from `state` cache.
 *
 * If `result` is not found, will attempt to generate it naturally
 * using params and schema. This increases cache hit rate for many
 * detail shapes.
 *
 * @returns [denormalizedValue, ready]
 */
declare function useDenormalized<Shape extends Pick<ReadShape<Schema$2 | undefined, any>, 'getFetchKey' | 'schema' | 'options'>>(shape: Shape, params: ParamsFromShape<Shape> | null, state: State$1<any>, 
/** @deprecated */
denormalizeCache?: any): {
    data: DenormalizeNullable$3<Shape['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
};

/**
 * Access a response if it is available.
 *
 * `useCache` guarantees referential equality globally.
 * @see https://resthooks.io/docs/api/useCache
 */
declare function useCache<E extends Pick<EndpointInterface$2<FetchFunction$2, Schema$2 | undefined, undefined>, 'key' | 'schema' | 'invalidIfStale'> | Pick<ReadShape<any, any>, 'getFetchKey' | 'schema' | 'options'>, Args extends (E extends {
    key: any;
} ? readonly [...Parameters<E['key']>] : readonly [ParamsFromShape<E>]) | readonly [null]>(endpoint: E, ...args: Args): E['schema'] extends {} ? DenormalizeNullable$3<E['schema']> : E extends (...args: any) => any ? ResolveType$2<E> | undefined : any;

type ErrorTypes = NetworkError$2 | UnknownError$2;
type UseErrorReturn<P> = P extends [null] ? undefined : ErrorTypes | undefined;
/**
 * Get any errors for a given request
 * @see https://resthooks.io/docs/api/useError
 */
declare function useError<E extends Pick<EndpointInterface$2<FetchFunction$2, Schema$2 | undefined, undefined>, 'key' | 'schema' | 'invalidIfStale'> | Pick<ReadShape<any, any>, 'getFetchKey' | 'schema' | 'options'>, Args extends (E extends {
    key: any;
} ? readonly [...Parameters<E['key']>] : readonly [ParamsFromShape<E>]) | readonly [null]>(endpoint: E, ...args: Args): UseErrorReturn<typeof args>;

/**
 * Gets meta for a fetch key.
 * @see https://resthooks.io/docs/api/useMeta
 */
declare function useMeta<E extends Pick<EndpointInterface$2<FetchFunction$2>, 'key'> | Pick<FetchShape<any, any>, 'getFetchKey'>, Args extends (E extends {
    key: any;
} ? readonly [...Parameters<E['key']>] : readonly [ParamsFromShape<E>]) | readonly [null]>(endpoint: E, ...args: Args): StateMeta | null;
type StateMeta<R = any> = State$1<R>['meta'][string];

type ResourceReturn<P, S extends {
    fetch: any;
    schema: any;
}> = CondNull<P, S['schema'] extends undefined ? ResolveType$2<S['fetch']> | undefined : DenormalizeNullable$3<S['schema']>, S['schema'] extends undefined ? ResolveType$2<S['fetch']> : Denormalize$3<S['schema']>>;
type CondNull<P, A, B> = P extends null ? A : B;
/**
 * Ensure a resource is available.
 * Suspends until it is.
 *
 * `useResource` guarantees referential equality globally.
 * @deprecated use https://resthooks.io/docs/api/useSuspense
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null>(v1: readonly [S1, P1]): [ResourceReturn<P1, S1>];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2]): [ResourceReturn<P1, S1>, ResourceReturn<P2, S2>];
declare function useResource<S extends ReadShape<any, any>, P extends ParamsFromShape<S> | null>(fetchShape: S, params: P): ResourceReturn<P, S>;
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3]): [ResourceReturn<P1, S1>, ResourceReturn<P2, S2>, ResourceReturn<P3, S3>];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null, S6 extends ReadShape<any, any>, P6 extends ParamsFromShape<S6> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5], v6: readonly [S6, P6]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>,
    ResourceReturn<P6, S6>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null, S6 extends ReadShape<any, any>, P6 extends ParamsFromShape<S6> | null, S7 extends ReadShape<any, any>, P7 extends ParamsFromShape<S7> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5], v6: readonly [S6, P6], v7: readonly [S7, P7]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>,
    ResourceReturn<P6, S6>,
    ResourceReturn<P7, S7>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null, S6 extends ReadShape<any, any>, P6 extends ParamsFromShape<S6> | null, S7 extends ReadShape<any, any>, P7 extends ParamsFromShape<S7> | null, S8 extends ReadShape<any, any>, P8 extends ParamsFromShape<S8> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5], v6: readonly [S6, P6], v7: readonly [S7, P7], v8: readonly [S8, P8]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>,
    ResourceReturn<P6, S6>,
    ResourceReturn<P7, S7>,
    ResourceReturn<P8, S8>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null, S6 extends ReadShape<any, any>, P6 extends ParamsFromShape<S6> | null, S7 extends ReadShape<any, any>, P7 extends ParamsFromShape<S7> | null, S8 extends ReadShape<any, any>, P8 extends ParamsFromShape<S8> | null, S9 extends ReadShape<any, any>, P9 extends ParamsFromShape<S9> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5], v6: readonly [S6, P6], v7: readonly [S7, P7], v8: readonly [S8, P8], v9: readonly [S9, P9]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>,
    ResourceReturn<P6, S6>,
    ResourceReturn<P7, S7>,
    ResourceReturn<P8, S8>,
    ResourceReturn<P9, S9>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null, S6 extends ReadShape<any, any>, P6 extends ParamsFromShape<S6> | null, S7 extends ReadShape<any, any>, P7 extends ParamsFromShape<S7> | null, S8 extends ReadShape<any, any>, P8 extends ParamsFromShape<S8> | null, S9 extends ReadShape<any, any>, P9 extends ParamsFromShape<S9> | null, S10 extends ReadShape<any, any>, P10 extends ParamsFromShape<S10> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5], v6: readonly [S6, P6], v7: readonly [S7, P7], v8: readonly [S8, P8], v9: readonly [S9, P9], v10: readonly [S10, P10]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>,
    ResourceReturn<P6, S6>,
    ResourceReturn<P7, S7>,
    ResourceReturn<P8, S8>,
    ResourceReturn<P9, S9>,
    ResourceReturn<P10, S10>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null, S6 extends ReadShape<any, any>, P6 extends ParamsFromShape<S6> | null, S7 extends ReadShape<any, any>, P7 extends ParamsFromShape<S7> | null, S8 extends ReadShape<any, any>, P8 extends ParamsFromShape<S8> | null, S9 extends ReadShape<any, any>, P9 extends ParamsFromShape<S9> | null, S10 extends ReadShape<any, any>, P10 extends ParamsFromShape<S10> | null, S11 extends ReadShape<any, any>, P11 extends ParamsFromShape<S11> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5], v6: readonly [S6, P6], v7: readonly [S7, P7], v8: readonly [S8, P8], v9: readonly [S9, P9], v10: readonly [S10, P10], v11: readonly [S11, P11]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>,
    ResourceReturn<P6, S6>,
    ResourceReturn<P7, S7>,
    ResourceReturn<P8, S8>,
    ResourceReturn<P9, S9>,
    ResourceReturn<P10, S10>,
    ResourceReturn<P11, S11>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null, S6 extends ReadShape<any, any>, P6 extends ParamsFromShape<S6> | null, S7 extends ReadShape<any, any>, P7 extends ParamsFromShape<S7> | null, S8 extends ReadShape<any, any>, P8 extends ParamsFromShape<S8> | null, S9 extends ReadShape<any, any>, P9 extends ParamsFromShape<S9> | null, S10 extends ReadShape<any, any>, P10 extends ParamsFromShape<S10> | null, S11 extends ReadShape<any, any>, P11 extends ParamsFromShape<S11> | null, S12 extends ReadShape<any, any>, P12 extends ParamsFromShape<S12> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5], v6: readonly [S6, P6], v7: readonly [S7, P7], v8: readonly [S8, P8], v9: readonly [S9, P9], v10: readonly [S10, P10], v11: readonly [S11, P11], v12: readonly [S12, P12]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>,
    ResourceReturn<P6, S6>,
    ResourceReturn<P7, S7>,
    ResourceReturn<P8, S8>,
    ResourceReturn<P9, S9>,
    ResourceReturn<P10, S10>,
    ResourceReturn<P11, S11>,
    ResourceReturn<P12, S12>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null, S6 extends ReadShape<any, any>, P6 extends ParamsFromShape<S6> | null, S7 extends ReadShape<any, any>, P7 extends ParamsFromShape<S7> | null, S8 extends ReadShape<any, any>, P8 extends ParamsFromShape<S8> | null, S9 extends ReadShape<any, any>, P9 extends ParamsFromShape<S9> | null, S10 extends ReadShape<any, any>, P10 extends ParamsFromShape<S10> | null, S11 extends ReadShape<any, any>, P11 extends ParamsFromShape<S11> | null, S12 extends ReadShape<any, any>, P12 extends ParamsFromShape<S12> | null, S13 extends ReadShape<any, any>, P13 extends ParamsFromShape<S13> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5], v6: readonly [S6, P6], v7: readonly [S7, P7], v8: readonly [S8, P8], v9: readonly [S9, P9], v10: readonly [S10, P10], v11: readonly [S11, P11], v12: readonly [S12, P12], v13: readonly [S13, P13]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>,
    ResourceReturn<P6, S6>,
    ResourceReturn<P7, S7>,
    ResourceReturn<P8, S8>,
    ResourceReturn<P9, S9>,
    ResourceReturn<P10, S10>,
    ResourceReturn<P11, S11>,
    ResourceReturn<P12, S12>,
    ResourceReturn<P13, S13>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null, S6 extends ReadShape<any, any>, P6 extends ParamsFromShape<S6> | null, S7 extends ReadShape<any, any>, P7 extends ParamsFromShape<S7> | null, S8 extends ReadShape<any, any>, P8 extends ParamsFromShape<S8> | null, S9 extends ReadShape<any, any>, P9 extends ParamsFromShape<S9> | null, S10 extends ReadShape<any, any>, P10 extends ParamsFromShape<S10> | null, S11 extends ReadShape<any, any>, P11 extends ParamsFromShape<S11> | null, S12 extends ReadShape<any, any>, P12 extends ParamsFromShape<S12> | null, S13 extends ReadShape<any, any>, P13 extends ParamsFromShape<S13> | null, S14 extends ReadShape<any, any>, P14 extends ParamsFromShape<S14> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5], v6: readonly [S6, P6], v7: readonly [S7, P7], v8: readonly [S8, P8], v9: readonly [S9, P9], v10: readonly [S10, P10], v11: readonly [S11, P11], v12: readonly [S12, P12], v13: readonly [S13, P13], v14: readonly [S14, P14]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>,
    ResourceReturn<P6, S6>,
    ResourceReturn<P7, S7>,
    ResourceReturn<P8, S8>,
    ResourceReturn<P9, S9>,
    ResourceReturn<P10, S10>,
    ResourceReturn<P11, S11>,
    ResourceReturn<P12, S12>,
    ResourceReturn<P13, S13>,
    ResourceReturn<P14, S14>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null, S6 extends ReadShape<any, any>, P6 extends ParamsFromShape<S6> | null, S7 extends ReadShape<any, any>, P7 extends ParamsFromShape<S7> | null, S8 extends ReadShape<any, any>, P8 extends ParamsFromShape<S8> | null, S9 extends ReadShape<any, any>, P9 extends ParamsFromShape<S9> | null, S10 extends ReadShape<any, any>, P10 extends ParamsFromShape<S10> | null, S11 extends ReadShape<any, any>, P11 extends ParamsFromShape<S11> | null, S12 extends ReadShape<any, any>, P12 extends ParamsFromShape<S12> | null, S13 extends ReadShape<any, any>, P13 extends ParamsFromShape<S13> | null, S14 extends ReadShape<any, any>, P14 extends ParamsFromShape<S14> | null, S15 extends ReadShape<any, any>, P15 extends ParamsFromShape<S15> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5], v6: readonly [S6, P6], v7: readonly [S7, P7], v8: readonly [S8, P8], v9: readonly [S9, P9], v10: readonly [S10, P10], v11: readonly [S11, P11], v12: readonly [S12, P12], v13: readonly [S13, P13], v14: readonly [S14, P14], v15: readonly [S15, P15]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>,
    ResourceReturn<P6, S6>,
    ResourceReturn<P7, S7>,
    ResourceReturn<P8, S8>,
    ResourceReturn<P9, S9>,
    ResourceReturn<P10, S10>,
    ResourceReturn<P11, S11>,
    ResourceReturn<P12, S12>,
    ResourceReturn<P13, S13>,
    ResourceReturn<P14, S14>,
    ResourceReturn<P15, S15>
];
declare function useResource<S1 extends ReadShape<any, any>, P1 extends ParamsFromShape<S1> | null, S2 extends ReadShape<any, any>, P2 extends ParamsFromShape<S2> | null, S3 extends ReadShape<any, any>, P3 extends ParamsFromShape<S3> | null, S4 extends ReadShape<any, any>, P4 extends ParamsFromShape<S4> | null, S5 extends ReadShape<any, any>, P5 extends ParamsFromShape<S5> | null, S6 extends ReadShape<any, any>, P6 extends ParamsFromShape<S6> | null, S7 extends ReadShape<any, any>, P7 extends ParamsFromShape<S7> | null, S8 extends ReadShape<any, any>, P8 extends ParamsFromShape<S8> | null, S9 extends ReadShape<any, any>, P9 extends ParamsFromShape<S9> | null, S10 extends ReadShape<any, any>, P10 extends ParamsFromShape<S10> | null, S11 extends ReadShape<any, any>, P11 extends ParamsFromShape<S11> | null, S12 extends ReadShape<any, any>, P12 extends ParamsFromShape<S12> | null, S13 extends ReadShape<any, any>, P13 extends ParamsFromShape<S13> | null, S14 extends ReadShape<any, any>, P14 extends ParamsFromShape<S14> | null, S15 extends ReadShape<any, any>, P15 extends ParamsFromShape<S15> | null, S16 extends ReadShape<any, any>, P16 extends ParamsFromShape<S16> | null>(v1: readonly [S1, P1], v2: readonly [S2, P2], v3: readonly [S3, P3], v4: readonly [S4, P4], v5: readonly [S5, P5], v6: readonly [S6, P6], v7: readonly [S7, P7], v8: readonly [S8, P8], v9: readonly [S9, P9], v10: readonly [S10, P10], v11: readonly [S11, P11], v12: readonly [S12, P12], v13: readonly [S13, P13], v14: readonly [S14, P14], v15: readonly [S15, P15], v16: readonly [S16, P16]): [
    ResourceReturn<P1, S1>,
    ResourceReturn<P2, S2>,
    ResourceReturn<P3, S3>,
    ResourceReturn<P4, S4>,
    ResourceReturn<P5, S5>,
    ResourceReturn<P6, S6>,
    ResourceReturn<P7, S7>,
    ResourceReturn<P8, S8>,
    ResourceReturn<P9, S9>,
    ResourceReturn<P10, S10>,
    ResourceReturn<P11, S11>,
    ResourceReturn<P12, S12>,
    ResourceReturn<P13, S13>,
    ResourceReturn<P14, S14>,
    ResourceReturn<P15, S15>,
    ResourceReturn<P16, S16>
];

/**
 * Request a resource if it is not in cache.\
 * @deprecated use https://resthooks.io/docs/api/useFetch
 */
declare function useRetrieve<Shape extends ReadShape<any, any>>(fetchShape: Shape, params: ParamsFromShape<Shape> | null, triggerFetch?: boolean, entitiesExpireAt?: number): any;

/**
 * Keeps a resource fresh by subscribing to updates.
 * @see https://resthooks.io/docs/api/useSubscription
 */
declare function useSubscription<E extends EndpointInterface$2<FetchFunction$2, Schema$2 | undefined, undefined> | ReadShape<any, any>, Args extends (E extends (...args: any) => any ? readonly [...Parameters<E>] : readonly [ParamsFromShape<E>]) | readonly [null]>(endpoint: E, ...args: Args): void;

export { ArrayElement, _default as AsyncBoundary, _default$1 as BackupBoundary, CacheProvider, ControllerContext, DeleteShape, DispatchContext, Endpoint, EndpointParam, EndpointExtraOptions$1 as FetchOptions, FetchShape, Index, IndexParams, MutateEndpoint, MutateShape, NetworkErrorBoundary, ParamsFromShape, ReadEndpoint, ReadShape, SetShapeParams, StateContext, Store, StoreContext, internal_d as __INTERNAL__, makeCacheProvider, useCache, useController, useDLE, useDenormalized, useError, useFetch, useLive, useMeta, usePromisifiedDispatch, useResource, useRetrieve, useSubscription, useSuspense };
