import * as _rest_hooks_core from '@rest-hooks/core';
import { Manager, State as State$1, Controller, NetworkError as NetworkError$1, ActionTypes, DenormalizeCache, legacyActions, __INTERNAL__, createReducer, applyManager } from '@rest-hooks/core';
export { AbstractInstanceType, ActionTypes, Controller, DefaultConnectionListener, Denormalize, DenormalizeNullable, DevToolsManager, Dispatch, EndpointExtraOptions, EndpointInterface, ExpiryStatus, FetchAction, FetchFunction, InvalidateAction, LogoutManager, Manager, Middleware, MiddlewareAPI, NetworkError, NetworkManager, Normalize, NormalizeNullable, PK, PollingSubscription, ReceiveAction, ReceiveTypes, ResetAction, ResolveType, Schema, State, SubscribeAction, SubscriptionManager, UnknownError, UnsubscribeAction, UpdateFunction, actionTypes } from '@rest-hooks/core';
import React$1, { Context } from 'react';
import * as packages_core_lib_controller_Controller from 'packages/core/lib/controller/Controller';

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
        error: NetworkError$1;
    }>;
}): JSX.Element;
declare const _default: React$1.MemoExoticComponent<typeof AsyncBoundary>;
//# sourceMappingURL=AsyncBoundary.d.ts.map

interface Props<E extends NetworkError$1> {
    children: React$1.ReactNode;
    fallbackComponent: React$1.ComponentType<{
        error: E;
    }>;
}
interface State<E extends NetworkError$1> {
    error?: E;
}
/**
 * Handles any networking errors from suspense
 * @see https://resthooks.io/docs/api/NetworkErrorBoundary
 */
declare class NetworkErrorBoundary<E extends NetworkError$1> extends React$1.Component<Props<E>, State<E>> {
    static defaultProps: {
        fallbackComponent: ({ error }: {
            error: NetworkError$1;
        }) => JSX.Element;
    };
    static getDerivedStateFromError(error: NetworkError$1 | any): {
        error: NetworkError$1;
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
 * Access a response if it is available.
 *
 * `useCache` guarantees referential equality globally.
 * @see https://resthooks.io/docs/api/useCache
 */
declare function useCache<E extends Pick<EndpointInterface<FetchFunction, Schema | undefined, undefined>, 'key' | 'schema' | 'invalidIfStale'>, Args extends readonly [...Parameters<E['key']>] | readonly [null]>(endpoint: E, ...args: Args): E['schema'] extends undefined ? E extends (...args: any) => any ? ResolveType<E> | undefined : any : DenormalizeNullable<E['schema']>;

type ErrorTypes = NetworkError | UnknownError;
type UseErrorReturn<P> = P extends [null] ? undefined : ErrorTypes | undefined;
/**
 * Get any errors for a given request
 * @see https://resthooks.io/docs/api/useError
 */
declare function useError<E extends Pick<EndpointInterface, 'key'>, Args extends readonly [...Parameters<E['key']>] | readonly [null]>(endpoint: E, ...args: Args): UseErrorReturn<Args>;

/**
 * Request a resource if it is not in cache.
 * @see https://resthooks.io/docs/api/useFetch
 */
declare function useFetch<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): ReturnType<E> | undefined;

/**
 * Keeps a resource fresh by subscribing to updates.
 * @see https://resthooks.io/docs/api/useSubscription
 */
declare function useSubscription<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): void;

type CondNull<P, A, B> = P extends null ? A : B;
type StatefulReturn<S extends Schema | undefined, P> = CondNull<P, {
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
/** @deprecated */
declare const DenormalizeCacheContext: Context<DenormalizeCache>;
declare const ControllerContext: Context<Controller<packages_core_lib_controller_Controller.CompatibleDispatch>>;
interface Store<S> {
    subscribe(listener: () => void): () => void;
    dispatch: React.Dispatch<ActionTypes>;
    getState(): S;
    uninitialized?: boolean;
}
declare const StoreContext: Context<Store<State$1<unknown>>>;

declare const useCacheState: () => State$1<unknown>;
//# sourceMappingURL=useCacheState.d.ts.map

/** @deprecated use Controller.dispatch */
declare const createFetch: typeof legacyActions.createFetch;
/** @deprecated use Controller.dispatch */
declare const createReceive: typeof legacyActions.createReceive;
/** @deprecated use Controller.dispatch */
declare const createReceiveError: typeof legacyActions.createReceiveError;
declare const initialState: _rest_hooks_core.State<unknown>;
declare const DELETED: symbol;
declare const inferResults: typeof __INTERNAL__.inferResults;

declare const internal_d_createFetch: typeof createFetch;
declare const internal_d_createReceive: typeof createReceive;
declare const internal_d_createReceiveError: typeof createReceiveError;
declare const internal_d_initialState: typeof initialState;
declare const internal_d_DELETED: typeof DELETED;
declare const internal_d_inferResults: typeof inferResults;
declare const internal_d_createReducer: typeof createReducer;
declare const internal_d_applyManager: typeof applyManager;
declare const internal_d_useCacheState: typeof useCacheState;
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
  };
}

/** Turns a dispatch function into one that resolves once its been commited */
declare function usePromisifiedDispatch<R extends React$1.Reducer<any, any>>(dispatch: React$1.Dispatch<React$1.ReducerAction<R>>, state: React$1.ReducerState<R>): (action: React$1.ReducerAction<R>) => Promise<void>;

export { _default as AsyncBoundary, _default$1 as BackupBoundary, CacheProvider, ControllerContext, DenormalizeCacheContext, DispatchContext, NetworkErrorBoundary, StateContext, Store, StoreContext, internal_d as __INTERNAL__, useCache, useController, useDLE, useError, useFetch, useLive, usePromisifiedDispatch, useSubscription, useSuspense };
