import * as _data_client_core from '@data-client/core';
import { Manager, State, Controller, NetworkError, EndpointInterface, FetchFunction, Schema, DenormalizeNullable, ResolveType, Denormalize, Queryable, SchemaArgs, UnknownError, ErrorTypes as ErrorTypes$1, ActionTypes, __INTERNAL__, createReducer, applyManager } from '@data-client/core';
export { AbstractInstanceType, ActionTypes, Controller, DataClientDispatch, DefaultConnectionListener, Denormalize, DenormalizeNullable, DevToolsManager, Dispatch, EndpointExtraOptions, EndpointInterface, ErrorTypes, ExpiryStatus, FetchAction, FetchFunction, GenericDispatch, InvalidateAction, LogoutManager, Manager, Middleware, MiddlewareAPI, NetworkError, NetworkManager, Normalize, NormalizeNullable, PK, PollingSubscription, ResetAction, ResolveType, Schema, SetAction, SetTypes, State, SubscribeAction, SubscriptionManager, UnknownError, UnsubscribeAction, UpdateFunction, actionTypes } from '@data-client/core';
import * as react_jsx_runtime from 'react/jsx-runtime';
import React$1, { Context } from 'react';

declare function Loading(): react_jsx_runtime.JSX.Element;

type DevToolsPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface ProviderProps {
    children: React$1.ReactNode;
    managers?: Manager[];
    initialState?: State<unknown>;
    Controller?: typeof Controller;
    devButton?: DevToolsPosition | null | undefined;
}
interface Props$1 {
    children: React$1.ReactNode;
    managers?: Manager[];
    initialState: State<unknown>;
    Controller: typeof Controller;
    devButton: DevToolsPosition | null | undefined;
}
/**
 * Manages state, providing all context needed to use the hooks.
 * @see https://dataclient.io/docs/api/CacheProvider
 */
declare function CacheProvider({ children, managers, initialState, Controller, devButton, }: Props$1): JSX.Element;
declare namespace CacheProvider {
    var defaultProps: {
        initialState: State<unknown>;
        Controller: typeof Controller;
        devButton: string;
    };
}

declare let getDefaultManagers: () => Manager<_data_client_core.ActionTypes>[];

/** Suspense but compatible with 18 SSR, 17, 16 and native */
declare const UniversalSuspense: React$1.FunctionComponent<{
    children?: React$1.ReactNode;
    fallback: React$1.ReactNode;
}>;
//# sourceMappingURL=UniversalSuspense.d.ts.map

/**
 * Handles loading and error conditions of Suspense
 * @see https://dataclient.io/docs/api/AsyncBoundary
 */
declare function AsyncBoundary({ children, errorComponent, fallback, ...errorProps }: Props): JSX.Element;
declare const _default: typeof AsyncBoundary;

interface Props {
    children: React$1.ReactNode;
    fallback?: React$1.ReactNode;
    errorClassName?: string;
    errorComponent?: React$1.ComponentType<{
        error: NetworkError;
        className?: string;
    }>;
}
//# sourceMappingURL=AsyncBoundary.d.ts.map

interface ErrorBoundaryProps<E extends NetworkError> {
    children: React$1.ReactNode;
    className?: string;
    fallbackComponent: React$1.ComponentType<{
        error: E;
        className?: string;
    }>;
}
interface ErrorState<E extends NetworkError> {
    error?: E;
}
/**
 * Handles any networking errors from suspense
 * @see https://dataclient.io/docs/api/NetworkErrorBoundary
 */
declare class NetworkErrorBoundary<E extends NetworkError> extends React$1.Component<ErrorBoundaryProps<E>, ErrorState<E>> {
    static defaultProps: {
        fallbackComponent: ({ error, className, }: {
            error: NetworkError;
            className: string;
        }) => react_jsx_runtime.JSX.Element;
    };
    static getDerivedStateFromError(error: NetworkError | any): {
        error: NetworkError;
    };
    state: ErrorState<E>;
    render(): JSX.Element;
}

type CondNull$1<P, A, B> = P extends null ? A : B;
type SuspenseReturn<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, Args extends readonly [...Parameters<E>] | readonly [null]> = CondNull$1<Args[0], E['schema'] extends undefined | null ? undefined : DenormalizeNullable<E['schema']>, E['schema'] extends undefined | null ? ResolveType<E> : Denormalize<E['schema']>>;

/**
 * Ensure an endpoint is available.
 * Suspends until it is.
 *
 * `useSuspense` guarantees referential equality globally.
 * @see https://dataclient.io/docs/api/useSuspense
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
declare function useSuspense<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): SuspenseReturn<E, Args>;

/**
 * Access a response if it is available.
 *
 * `useCache` guarantees referential equality globally.
 * @see https://dataclient.io/docs/api/useCache
 */
declare function useCache<E extends Pick<EndpointInterface<FetchFunction, Schema | undefined, undefined | false | true>, 'key' | 'schema' | 'invalidIfStale'>, Args extends readonly [...Parameters<E['key']>] | readonly [null]>(endpoint: E, ...args: Args): E['schema'] extends undefined | null ? E extends (...args: any) => any ? ResolveType<E> | undefined : any : DenormalizeNullable<E['schema']>;

/**
 * Query the store.
 *
 * `useQuery` results are globally memoized.
 * @see https://dataclient.io/docs/api/useQuery
 */
declare function useQuery<S extends Queryable>(schema: S, ...args: SchemaArgs<S>): DenormalizeNullable<S> | undefined;

type ErrorTypes = NetworkError | UnknownError;
type UseErrorReturn<P> = P extends [null] ? undefined : ErrorTypes | undefined;
/**
 * Get any errors for a given request
 * @see https://dataclient.io/docs/api/useError
 */
declare function useError<E extends Pick<EndpointInterface, 'key'>, Args extends readonly [...Parameters<E['key']>] | readonly [null]>(endpoint: E, ...args: Args): UseErrorReturn<Args>;

/**
 * Request a resource if it is not in cache.
 * @see https://dataclient.io/docs/api/useFetch
 */
declare function useFetch<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): (E["schema"] extends null | undefined ? ReturnType<E> : Promise<Denormalize<E["schema"]>>) | undefined;

/**
 * Keeps a resource fresh by subscribing to updates.
 * @see https://dataclient.io/docs/api/useSubscription
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
 * @see https://dataclient.io/docs/api/useDLE
 */
declare function useDLE<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): E['schema'] extends undefined | null ? {
    data: E extends (...args: any) => any ? ResolveType<E> | undefined : any;
    loading: boolean;
    error: ErrorTypes$1 | undefined;
} : StatefulReturn<E['schema'], Args[0]>;

/**
 * Imperative control of Reactive Data Client store
 * @see https://dataclient.io/docs/api/useController
 */
declare function useController(): Controller;

/**
 * Ensure an endpoint is available. Keeps it fresh once it is.
 *
 * useSuspense() + useSubscription()
 * @see https://dataclient.io/docs/api/useLive
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
declare function useLive<E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>, Args extends readonly [...Parameters<E>] | readonly [null]>(endpoint: E, ...args: Args): SuspenseReturn<E, Args>;

declare const StateContext: Context<State<unknown>>;
declare const ControllerContext: Context<Controller<_data_client_core.DataClientDispatch>>;
interface Store<S> {
    subscribe(listener: () => void): () => void;
    dispatch: React.Dispatch<ActionTypes>;
    getState(): S;
    uninitialized?: boolean;
}
declare const StoreContext: Context<Store<State<unknown>>>;

declare const useCacheState: () => State<unknown>;
//# sourceMappingURL=useCacheState.d.ts.map

declare const initialState: _data_client_core.State<unknown>;
declare const INVALID: symbol;
declare const inferResults: typeof __INTERNAL__.inferResults;

declare const internal_d_initialState: typeof initialState;
declare const internal_d_INVALID: typeof INVALID;
declare const internal_d_inferResults: typeof inferResults;
declare const internal_d_createReducer: typeof createReducer;
declare const internal_d_applyManager: typeof applyManager;
declare const internal_d_useCacheState: typeof useCacheState;
declare namespace internal_d {
  export {
    internal_d_initialState as initialState,
    internal_d_INVALID as INVALID,
    internal_d_inferResults as inferResults,
    internal_d_createReducer as createReducer,
    internal_d_applyManager as applyManager,
    internal_d_useCacheState as useCacheState,
  };
}

/** Turns a dispatch function into one that resolves once its been commited */
declare function usePromisifiedDispatch<R extends React$1.Reducer<any, any>>(dispatch: React$1.Dispatch<React$1.ReducerAction<R>>, state: React$1.ReducerState<R>): (action: React$1.ReducerAction<R>) => Promise<void>;

export { _default as AsyncBoundary, Loading as BackupLoading, CacheProvider, ControllerContext, DevToolsPosition, NetworkErrorBoundary, ProviderProps, StateContext, Store, StoreContext, UniversalSuspense, internal_d as __INTERNAL__, getDefaultManagers, useCache, useController, useDLE, useError, useFetch, useLive, usePromisifiedDispatch, useQuery, useSubscription, useSuspense };
