import * as _data_client_core from '@data-client/core';
import { Manager, State as State$1, Controller, NetworkError, EndpointInterface, FetchFunction, Schema, DenormalizeNullable, ResolveType, Denormalize, UnknownError, ErrorTypes as ErrorTypes$1, ActionTypes, __INTERNAL__, createReducer, applyManager } from '@data-client/core';
export { AbstractInstanceType, ActionTypes, Controller, DataClientDispatch, DefaultConnectionListener, Denormalize, DenormalizeNullable, DevToolsManager, Dispatch, EndpointExtraOptions, EndpointInterface, ErrorTypes, ExpiryStatus, FetchAction, FetchFunction, GenericDispatch, InvalidateAction, LogoutManager, Manager, Middleware, MiddlewareAPI, NetworkError, NetworkManager, Normalize, NormalizeNullable, PK, PollingSubscription, ReceiveAction, SetTypes as ReceiveTypes, ResetAction, ResolveType, Schema, State, SubscribeAction, SubscriptionManager, UnknownError, UnsubscribeAction, UpdateFunction, actionTypes } from '@data-client/core';
import React$1, { Context } from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';

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
declare function CacheProvider({ children, managers, initialState, Controller, }: ProviderProps): react_jsx_runtime.JSX.Element;
declare namespace CacheProvider {
    var defaultProps: {
        managers: Manager<_data_client_core.ActionTypes>[];
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
        error: NetworkError;
    }>;
}): JSX.Element;
declare const _default: typeof AsyncBoundary;
//# sourceMappingURL=AsyncBoundary.d.ts.map

interface Props<E extends NetworkError> {
    children: React$1.ReactNode;
    fallbackComponent: React$1.ComponentType<{
        error: E;
    }>;
}
interface State<E extends NetworkError> {
    error?: E;
}
/**
 * Handles any networking errors from suspense
 * @see https://resthooks.io/docs/api/NetworkErrorBoundary
 */
declare class NetworkErrorBoundary<E extends NetworkError> extends React$1.Component<Props<E>, State<E>> {
    static defaultProps: {
        fallbackComponent: ({ error }: {
            error: NetworkError;
        }) => react_jsx_runtime.JSX.Element;
    };
    static getDerivedStateFromError(error: NetworkError | any): {
        error: NetworkError;
    };
    state: State<E>;
    render(): JSX.Element;
}

type CondNull$1<P, A, B> = P extends null ? A : B;
type SuspenseReturn<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, Args extends readonly [...Parameters<E>] | readonly [null]> = CondNull$1<Args[0], E['schema'] extends undefined | null ? undefined : DenormalizeNullable<E['schema']>, E['schema'] extends undefined | null ? ResolveType<E> : Denormalize<E['schema']>>;

/**
 * Ensure an endpoint is available.
 * Suspends until it is.
 *
 * `useSuspense` guarantees referential equality globally.
 * @see https://resthooks.io/docs/api/useSuspense
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
declare function useSuspense<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): SuspenseReturn<E, Args>;

/**
 * Access a response if it is available.
 *
 * `useCache` guarantees referential equality globally.
 * @see https://resthooks.io/docs/api/useCache
 */
declare function useCache<E extends Pick<EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, 'key' | 'schema' | 'invalidIfStale'>, Args extends readonly [...Parameters<E['key']>] | readonly [null]>(endpoint: E, ...args: Args): E['schema'] extends undefined | null ? E extends (...args: any) => any ? ResolveType<E> | undefined : any : DenormalizeNullable<E['schema']>;

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
declare function useFetch<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): (E["schema"] extends null | undefined ? ReturnType<E> : Promise<Denormalize<E["schema"]>>) | undefined;

/**
 * Keeps a resource fresh by subscribing to updates.
 * @see https://resthooks.io/docs/api/useSubscription
 */
declare function useSubscription<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): void;

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
declare function useDLE<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): E['schema'] extends undefined | null ? {
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
declare function useLive<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): SuspenseReturn<E, Args>;

declare const StateContext: Context<State$1<unknown>>;
declare const ControllerContext: Context<Controller<_data_client_core.DataClientDispatch>>;
interface Store<S> {
    subscribe(listener: () => void): () => void;
    dispatch: React.Dispatch<ActionTypes>;
    getState(): S;
    uninitialized?: boolean;
}
declare const StoreContext: Context<Store<State$1<unknown>>>;

declare const useCacheState: () => State$1<unknown>;
//# sourceMappingURL=useCacheState.d.ts.map

declare const initialState: _data_client_core.State<unknown>;
declare const DELETED: symbol;
declare const INVALID: symbol;
declare const inferResults: typeof __INTERNAL__.inferResults;

declare const internal_d_initialState: typeof initialState;
declare const internal_d_DELETED: typeof DELETED;
declare const internal_d_INVALID: typeof INVALID;
declare const internal_d_inferResults: typeof inferResults;
declare const internal_d_createReducer: typeof createReducer;
declare const internal_d_applyManager: typeof applyManager;
declare const internal_d_useCacheState: typeof useCacheState;
declare namespace internal_d {
  export {
    internal_d_initialState as initialState,
    internal_d_DELETED as DELETED,
    internal_d_INVALID as INVALID,
    internal_d_inferResults as inferResults,
    internal_d_createReducer as createReducer,
    internal_d_applyManager as applyManager,
    internal_d_useCacheState as useCacheState,
  };
}

/** Turns a dispatch function into one that resolves once its been commited */
declare function usePromisifiedDispatch<R extends React$1.Reducer<any, any>>(dispatch: React$1.Dispatch<React$1.ReducerAction<R>>, state: React$1.ReducerState<R>): (action: React$1.ReducerAction<R>) => Promise<void>;

export { _default as AsyncBoundary, _default$1 as BackupBoundary, CacheProvider, ControllerContext, NetworkErrorBoundary, StateContext, Store, StoreContext, internal_d as __INTERNAL__, useCache, useController, useDLE, useError, useFetch, useLive, usePromisifiedDispatch, useSubscription, useSuspense };
