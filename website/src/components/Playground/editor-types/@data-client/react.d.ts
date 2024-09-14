import * as _data_client_core from '@data-client/core';
import { NetworkManager, Manager, State, Controller, DevToolsManager, DevToolsConfig, SubscriptionManager, EndpointInterface as EndpointInterface$1, FetchFunction as FetchFunction$1, Schema as Schema$1, ResolveType as ResolveType$1, Denormalize as Denormalize$1, DenormalizeNullable as DenormalizeNullable$1, Queryable as Queryable$1, NI, SchemaArgs, NetworkError as NetworkError$1, UnknownError as UnknownError$1, ErrorTypes as ErrorTypes$2, __INTERNAL__, createReducer, applyManager, actions } from '@data-client/core';
export { AbstractInstanceType, ActionTypes, Controller, DataClientDispatch, DefaultConnectionListener, Denormalize, DenormalizeNullable, DevToolsManager, Dispatch, EndpointExtraOptions, EndpointInterface, EntityInterface, ErrorTypes, ExpiryStatus, FetchAction, FetchFunction, GenericDispatch, InvalidateAction, LogoutManager, Manager, Middleware, MiddlewareAPI, NetworkError, NetworkManager, Normalize, NormalizeNullable, PK, PollingSubscription, Queryable, ResetAction, ResolveType, Schema, SchemaArgs, SchemaClass, SetAction, SetResponseAction, State, SubscribeAction, SubscriptionManager, UnknownError, UnsubscribeAction, UpdateFunction, actionTypes } from '@data-client/core';
import * as react_jsx_runtime from 'react/jsx-runtime';
import React, { JSX, Context } from 'react';

/** Can help prevent stuttering by waiting for idle for sideEffect free fetches */
declare class WebIdlingNetworkManager extends NetworkManager {
}

declare function BackupLoading(): react_jsx_runtime.JSX.Element;

type DevToolsPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface ProviderProps {
    children: React.ReactNode;
    managers?: Manager[];
    initialState?: State<unknown>;
    Controller?: typeof Controller;
    devButton?: DevToolsPosition | null | undefined;
}
interface Props$1 {
    children: React.ReactNode;
    managers?: Manager[];
    initialState?: State<unknown>;
    Controller?: typeof Controller;
    devButton?: DevToolsPosition | null | undefined;
}
/**
 * Manages state, providing all context needed to use the hooks.
 * @see https://dataclient.io/docs/api/DataProvider
 */
declare function DataProvider({ children, managers, initialState, Controller, devButton, }: Props$1): JSX.Element;

/** Returns the default Managers used by DataProvider.
 *
 * @see https://dataclient.io/docs/api/getDefaultManagers
 */
declare let getDefaultManagers: ({ devToolsManager, networkManager, subscriptionManager, }?: GetManagersOptions) => Manager[];

type GetManagersOptions = {
    devToolsManager?: DevToolsManager | DevToolsConfig | null;
    networkManager?: NetworkManager | ConstructorArgs<typeof NetworkManager>;
    subscriptionManager?: SubscriptionManager | ConstructorArgs<typeof SubscriptionManager> | null;
};
type ConstructorArgs<T extends {
    new (...args: any): any;
}> = T extends {
    new (options: infer O): any;
} ? O : never;

/** Suspense but compatible with 18 SSR, 17, 16 and native */
declare const UniversalSuspense: React.FunctionComponent<{
    children?: React.ReactNode;
    fallback: React.ReactNode;
}>;
//# sourceMappingURL=UniversalSuspense.d.ts.map

interface ErrorBoundaryProps<E extends Error> {
    children: React.ReactNode;
    /** className prop sent to fallbackComponent */
    className?: string;
    /** Renders when an error is caught */
    fallbackComponent: React.ComponentType<{
        error: E;
        resetErrorBoundary: () => void;
        className?: string;
    }>;
    /** Subscription handler to reset error state on events like URL location changes */
    listen?: (resetListener: () => void) => () => void;
}
interface ErrorState<E extends Error> {
    error?: E;
}
/**
 * Reusable React error boundary component
 * @see https://dataclient.io/docs/api/ErrorBoundary
 */
declare class ErrorBoundary<E extends Error> extends React.Component<ErrorBoundaryProps<E>, ErrorState<E>> {
    static defaultProps: {
        fallbackComponent: ({ error, className, }: {
            error: Error;
            resetErrorBoundary: () => void;
            className?: string;
        }) => react_jsx_runtime.JSX.Element;
    };
    static getDerivedStateFromError(error: Error): {
        error: Error;
    };
    private unsubscribe;
    state: ErrorState<E>;
    componentDidMount(): void;
    componentDidUpdate(prevProps: Readonly<ErrorBoundaryProps<E>>, prevState: Readonly<ErrorState<E>>, snapshot?: any): void;
    componentWillUnmount(): void;
    listen(): void;
    unlisten(): void;
    render(): JSX.Element;
}

/**
 * Handles loading and error conditions of Suspense
 * @see https://dataclient.io/docs/api/AsyncBoundary
 */
declare function AsyncBoundary({ children, errorComponent, fallback, ...errorProps }: Props): JSX.Element;
declare const _default: typeof AsyncBoundary;

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    errorClassName?: string;
    /** Renders when an error is caught */
    errorComponent?: ErrorBoundaryProps<Error>['fallbackComponent'];
    /** Subscription handler to reset error state on events like URL location changes */
    listen?: ErrorBoundaryProps<Error>['listen'];
}

/**
 * Ensure an endpoint is available.
 * Suspends until it is.
 *
 * `useSuspense` guarantees referential equality globally.
 * @see https://dataclient.io/docs/api/useSuspense
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
declare function useSuspense<E extends EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>]): E['schema'] extends undefined | null ? ResolveType$1<E> : Denormalize$1<E['schema']>;
declare function useSuspense<E extends EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E['schema'] extends undefined | null ? ResolveType$1<E> | undefined : DenormalizeNullable$1<E['schema']>;

/**
 * Read an Endpoint's response if it is ready.
 *
 * `useCache` guarantees referential equality globally.
 * @see https://dataclient.io/docs/api/useCache
 */
declare function useCache<E extends Pick<EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | boolean>, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...args: readonly [...Parameters<E['key']>] | readonly [null]): E['schema'] extends undefined | null ? E extends (...args: any) => any ? ResolveType$1<E> | undefined : any : DenormalizeNullable$1<E['schema']>;

/**
 * Query the store.
 *
 * `useQuery` results are globally memoized.
 * @see https://dataclient.io/docs/api/useQuery
 */
declare function useQuery<S extends Queryable$1>(schema: S, ...args: NI<SchemaArgs<S>>): DenormalizeNullable$1<S> | undefined;

type ErrorTypes$1 = NetworkError$1 | UnknownError$1;
/**
 * Get any errors for a given request
 * @see https://dataclient.io/docs/api/useError
 */
declare function useError<E extends Pick<EndpointInterface$1, 'key'>>(endpoint: E, ...args: readonly [...Parameters<E['key']>] | readonly [null]): ErrorTypes$1 | undefined;

/**
 * Fetch an Endpoint if it is not in cache or stale.
 * @see https://dataclient.io/docs/api/useFetch
 */
declare function useFetch<E extends EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>]): E['schema'] extends undefined | null ? ReturnType<E> : Promise<Denormalize$1<E['schema']>>;
declare function useFetch<E extends EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E['schema'] extends undefined | null ? ReturnType<E> | undefined : Promise<DenormalizeNullable$1<E['schema']>>;

/**
 * Keeps a resource fresh by subscribing to updates.
 * @see https://dataclient.io/docs/api/useSubscription
 */
declare function useSubscription<E extends EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): void;

type SchemaReturn<S extends Schema$1 | undefined> = {
    data: Denormalize$1<S>;
    loading: false;
    error: undefined;
} | {
    data: DenormalizeNullable$1<S>;
    loading: true;
    error: undefined;
} | {
    data: DenormalizeNullable$1<S>;
    loading: false;
    error: ErrorTypes$2;
};
type AsyncReturn<E> = {
    data: E extends (...args: any) => any ? ResolveType$1<E> : any;
    loading: false;
    error: undefined;
} | {
    data: undefined;
    loading: true;
    error: undefined;
} | {
    data: undefined;
    loading: false;
    error: ErrorTypes$2;
};
/**
 * Use async data with { data, loading, error } (DLE)
 * @see https://dataclient.io/docs/api/useDLE
 */
declare function useDLE<E extends EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>]): E['schema'] extends undefined | null ? AsyncReturn<E> : SchemaReturn<E['schema']>;
declare function useDLE<E extends EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): {
    data: E['schema'] extends undefined | null ? undefined : DenormalizeNullable$1<E['schema']>;
    loading: boolean;
    error: ErrorTypes$2 | undefined;
};

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
declare function useLive<E extends EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>]): E['schema'] extends undefined | null ? ResolveType$1<E> : Denormalize$1<E['schema']>;
declare function useLive<E extends EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E['schema'] extends undefined | null ? ResolveType$1<E> | undefined : DenormalizeNullable$1<E['schema']>;

/**
 * Keeps value updated after delay time
 *
 * @see https://dataclient.io/docs/api/useDebounce
 * @param value Any immutable value
 * @param delay Time in miliseconds to wait til updating the value
 * @param updatable Whether to update at all
 * @example
 ```
 const debouncedFilter = useDebounce(filter, 200);
 const list = useSuspense(getThings, { filter: debouncedFilter });
 ```
 */
declare function useDebounce<T>(value: T, delay: number, updatable?: boolean): T;

type Schema = null | string | {
    [K: string]: any;
} | Schema[] | SchemaSimple | Serializable;
interface Queryable<Args extends readonly any[] = readonly any[]> {
    queryKey(args: Args, queryKey: (...args: any) => any, getEntity: GetEntity, getIndex: GetIndex): {};
}
type Serializable<T extends {
    toJSON(): string;
} = {
    toJSON(): string;
}> = (value: any) => T;
interface SchemaSimple<T = any, Args extends readonly any[] = any[]> {
    normalize(input: any, parent: any, key: any, args: any[], visit: (...args: any) => any, addEntity: (...args: any) => any, getEntity: (...args: any) => any, checkLoop: (...args: any) => any): any;
    denormalize(input: {}, args: readonly any[], unvisit: (schema: any, input: any) => any): T;
    queryKey(args: Args, queryKey: (...args: any) => any, getEntity: GetEntity, getIndex: GetIndex): any;
}
interface EntityInterface<T = any> extends SchemaSimple {
    createIfValid(props: any): any;
    pk(params: any, parent?: any, key?: string, args?: readonly any[]): string | number | undefined;
    readonly key: string;
    merge(existing: any, incoming: any): any;
    mergeWithStore(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
    mergeMetaWithStore(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
    indexes?: any;
    schema: Record<string, Schema>;
    cacheWith?: object;
    prototype: T;
}
/** Get Array of entities with map function applied */
interface GetEntity {
    (entityKey: string | symbol): {
        readonly [pk: string]: any;
    } | undefined;
    (entityKey: string | symbol, pk: string | number): any;
}
/** Get PK using an Entity Index */
interface GetIndex {
    /** getIndex('User', 'username', 'ntucker') */
    (entityKey: string, field: string, value: string): {
        readonly [indexKey: string]: string | undefined;
    };
}

type AbstractInstanceType<T> = T extends new (...args: any) => infer U ? U : T extends {
    prototype: infer U;
} ? U : never;
type DenormalizeObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? Denormalize<S[K]> : S[K];
};
type DenormalizeNullableObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? DenormalizeNullable<S[K]> : S[K];
};
interface NestedSchemaClass<T = any> {
    schema: Record<string, Schema>;
    prototype: T;
}
interface RecordClass<T = any> extends NestedSchemaClass<T> {
    fromJS: (...args: any) => AbstractInstanceType<T>;
}
type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> = keyof S['schema'] extends never ? S['prototype'] : string extends keyof S['schema'] ? S['prototype'] : S['prototype'];
type Denormalize<S> = S extends EntityInterface<infer U> ? U : S extends RecordClass ? AbstractInstanceType<S> : S extends {
    denormalize: (...args: any) => any;
} ? ReturnType<S['denormalize']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Denormalize<F>[] : S extends {
    [K: string]: any;
} ? DenormalizeObject<S> : S;
type DenormalizeNullable<S> = S extends EntityInterface<any> ? DenormalizeNullableNestedSchema<S> | undefined : S extends RecordClass ? DenormalizeNullableNestedSchema<S> : S extends {
    _denormalizeNullable: (...args: any) => any;
} ? ReturnType<S['_denormalizeNullable']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Denormalize<F>[] | undefined : S extends {
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
type ErrorTypes = NetworkError | UnknownError;

/** What the function's promise resolves to */
type ResolveType<E extends (...args: any) => any> = ReturnType<E> extends Promise<infer R> ? R : never;

type ExpiryStatusInterface = 1 | 2 | 3;

interface SnapshotInterface {
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://dataclient.io/docs/api/Snapshot#getResponse
     */
    getResponse<E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...args: readonly any[]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatusInterface;
        expiresAt: number;
    };
    /** @see https://dataclient.io/docs/api/Snapshot#getError */
    getError: <E extends Pick<EndpointInterface, 'key'>, Args extends readonly [...Parameters<E['key']>]>(endpoint: E, ...args: Args) => ErrorTypes | undefined;
    /**
     * Retrieved memoized value for any Querable schema
     * @see https://dataclient.io/docs/api/Snapshot#get
     */
    get<S extends Queryable>(schema: S, ...args: readonly any[]): any;
    readonly fetchedAt: number;
    readonly abort: Error;
}

/** Defines a networking endpoint */
interface EndpointInterface<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined, M extends boolean | undefined = boolean | undefined> extends EndpointExtraOptions<F> {
    (...args: Parameters<F>): ReturnType<F>;
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
    /** Enables optimistic updates for this request - uses return value as assumed network response */
    getOptimisticResponse?(snap: SnapshotInterface, ...args: Parameters<F>): ResolveType<F>;
    /** Determines whether to throw or fallback to */
    errorPolicy?(error: any): 'hard' | 'soft' | undefined;
    /** User-land extra data to send */
    readonly extra?: any;
}

type FetchFunction<A extends readonly any[] = any, R = any> = (...args: A) => Promise<R>;

/**
 * Builds an Endpoint that cancels fetch everytime params change
 *
 * @see https://dataclient.io/docs/api/useCancelling
 * @example
 ```
 useSuspense(useCancelling(MyEndpoint, { id }), { id })
 ```
 */
declare function useCancelling<E extends EndpointInterface & {
    extend: (o: {
        signal?: AbortSignal;
    }) => any;
}>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E;

/**
 * Takes an async function and tracks resolution as a boolean.
 *
 * @see https://dataclient.io/docs/api/useLoading
 * @param func A function returning a promise
 * @param deps Deps list sent to useCallback()
 * @example
 ```
 function Button({ onClick, children, ...props }) {
   const [clickHandler, loading] = useLoading(onClick);
   return (
     <button onClick={clickHandler} {...props}>
       {loading ? 'Loading...' : children}
     </button>
   );
 }
 ```
 */
declare function useLoading<F extends (...args: any) => Promise<any>>(func: F, deps?: readonly any[]): [F, boolean, Error | undefined];

declare const StateContext: Context<State<unknown>>;
declare const ControllerContext: Context<Controller<_data_client_core.DataClientDispatch>>;
interface Store<S> {
    subscribe(listener: () => void): () => void;
    getState(): S;
    uninitialized?: boolean;
}
declare const StoreContext: Context<Store<State<unknown>>>;

declare const useCacheState: () => State<unknown>;
//# sourceMappingURL=useCacheState.d.ts.map

declare const initialState: _data_client_core.State<unknown>;
declare const INVALID: symbol;
declare const MemoCache: typeof __INTERNAL__.MemoCache;

declare const internal_d_initialState: typeof initialState;
declare const internal_d_INVALID: typeof INVALID;
declare const internal_d_MemoCache: typeof MemoCache;
declare const internal_d_createReducer: typeof createReducer;
declare const internal_d_applyManager: typeof applyManager;
declare const internal_d_actions: typeof actions;
declare const internal_d_useCacheState: typeof useCacheState;
declare namespace internal_d {
  export {
    internal_d_initialState as initialState,
    internal_d_INVALID as INVALID,
    internal_d_MemoCache as MemoCache,
    internal_d_createReducer as createReducer,
    internal_d_applyManager as applyManager,
    internal_d_actions as actions,
    internal_d_useCacheState as useCacheState,
  };
}

/** Turns a dispatch function into one that resolves once its been commited */
declare function usePromisifiedDispatch<R extends React.Reducer<any, any>>(dispatch: React.Dispatch<React.ReducerAction<R>>, state: React.ReducerState<R>): (action: React.ReducerAction<R>) => Promise<void>;

export { _default as AsyncBoundary, BackupLoading, DataProvider as CacheProvider, ControllerContext, DataProvider, DevToolsPosition, ErrorBoundary, WebIdlingNetworkManager as IdlingNetworkManager, ErrorBoundary as NetworkErrorBoundary, ProviderProps, StateContext, Store, StoreContext, UniversalSuspense, internal_d as __INTERNAL__, getDefaultManagers, useCache, useCancelling, useController, useDLE, useDebounce, useError, useFetch, useLive, useLoading, usePromisifiedDispatch, useQuery, useSubscription, useSuspense };
