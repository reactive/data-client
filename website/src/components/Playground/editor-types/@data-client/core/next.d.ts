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
    normalize(input: any, parent: any, key: any, visit: (...args: any) => any, addEntity: (...args: any) => any, visitedEntities: Record<string, any>, storeEntities?: any, args?: any[]): any;
    denormalize(input: {}, args: any, unvisit: (input: any, schema: any) => any): T;
    infer(args: readonly any[], indexes: NormalizedIndex, recurse: (...args: any) => any, entities: EntityTable): any;
}
interface EntityInterface<T = any> extends SchemaSimple {
    createIfValid(props: any): any;
    pk(params: any, parent?: any, key?: string, args?: readonly any[]): string | undefined;
    readonly key: string;
    merge(existing: any, incoming: any): any;
    mergeWithStore(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
    mergeMetaWithStore(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
    indexes?: any;
    schema: Record<string, Schema>;
    cacheWith?: object;
    prototype: T;
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

/** Maps entity dependencies to a value (usually their denormalized form)
 *
 * Dependencies store `Path` to enable quick traversal using only `State`
 * If *any* members of the dependency get cleaned up, so does that key/value pair get removed.
 */
declare class WeakEntityMap<K extends object = object, V = any> {
    readonly next: WeakMap<K, Link<K, V>>;
    nextPath: Path | undefined;
    get(entity: K, getEntity: GetEntity<K | symbol>): readonly [undefined, undefined] | [V, Path[]];
    set(dependencies: Dep<K>[], value: V): void;
}
type GetEntity<K = object | symbol> = (lookup: Path) => K;
/** Link in a chain */
declare class Link<K extends object, V> {
    next: WeakMap<K, Link<K, V>>;
    value: V | undefined;
    journey: Path[];
    nextPath: Path | undefined;
}
interface Dep<K = object> {
    path: Path;
    entity: K;
}

interface Path {
    key: string;
    pk: string;
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
type NormalizeObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? Normalize<S[K]> : S[K];
};
interface NestedSchemaClass<T = any> {
    schema: Record<string, Schema>;
    prototype: T;
}
interface RecordClass<T = any> extends NestedSchemaClass<T> {
    fromJS: (...args: any) => AbstractInstanceType<T>;
}
interface DenormalizeCache {
    entities: {
        [key: string]: {
            [pk: string]: WeakMap<EntityInterface, WeakEntityMap<object, any>>;
        };
    };
    results: {
        [key: string]: WeakEntityMap<object, any>;
    };
}
type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> = keyof S['schema'] extends never ? S['prototype'] : string extends keyof S['schema'] ? S['prototype'] : S['prototype'];
type NormalizeReturnType<T> = T extends (...args: any) => infer R ? R : never;
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
type Normalize<S> = S extends EntityInterface ? string : S extends RecordClass ? NormalizeObject<S['schema']> : S extends {
    normalize: (...args: any) => any;
} ? NormalizeReturnType<S['normalize']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Normalize<F>[] : S extends {
    [K: string]: any;
} ? NormalizeObject<S> : S;

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

declare const enum ExpiryStatus {
    Invalid = 1,
    InvalidIfStale = 2,
    Valid = 3
}
type ExpiryStatusInterface = 1 | 2 | 3;

interface SnapshotInterface {
    getResponse: <E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>, Args extends readonly [...Parameters<E['key']>]>(endpoint: E, ...args: Args) => {
        data: any;
        expiryStatus: ExpiryStatusInterface;
        expiresAt: number;
    };
    getError: <E extends Pick<EndpointInterface, 'key'>, Args extends readonly [...Parameters<E['key']>]>(endpoint: E, ...args: Args) => ErrorTypes | undefined;
    readonly fetchedAt: number;
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

type ResultEntry<E extends EndpointInterface> = E['schema'] extends undefined | null ? ResolveType<E> : Normalize<E['schema']>;
type EndpointUpdateFunction<Source extends EndpointInterface, Updaters extends Record<string, any> = Record<string, any>> = (source: ResultEntry<Source>, ...args: any) => {
    [K in keyof Updaters]: (result: Updaters[K]) => Updaters[K];
};

declare const FETCH_TYPE: "rdc/fetch";
declare const SET_TYPE: "rdc/set";
declare const OPTIMISTIC_TYPE: "rdc/optimistic";
declare const RESET_TYPE: "rdc/reset";
declare const SUBSCRIBE_TYPE: "rdc/subscribe";
declare const UNSUBSCRIBE_TYPE: "rdc/unsubscribe";
declare const INVALIDATE_TYPE: "rdc/invalidate";
declare const INVALIDATEALL_TYPE: "rdc/invalidateall";
declare const EXPIREALL_TYPE: "rdc/expireall";
declare const GC_TYPE: "rdc/gc";

type EndpointAndUpdate<E extends EndpointInterface> = EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
};
type EndpointDefault = EndpointInterface & {
    update?: EndpointUpdateFunction<EndpointInterface>;
};
interface SetMeta {
    args: readonly any[];
    key: string;
    fetchedAt: number;
    date: number;
    expiresAt: number;
}
interface SetActionSuccess<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof SET_TYPE;
    endpoint: E;
    meta: SetMeta;
    payload: ResolveType<E>;
    error?: false;
}
interface SetActionError<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof SET_TYPE;
    endpoint: E;
    meta: SetMeta;
    payload: UnknownError;
    error: true;
}
type SetAction<E extends EndpointAndUpdate<E> = EndpointDefault> = SetActionSuccess<E> | SetActionError<E>;
interface FetchMeta {
    args: readonly any[];
    key: string;
    throttle: boolean;
    resolve: (value?: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void;
    promise: PromiseLike<any>;
    createdAt: number;
    nm?: boolean;
}
interface FetchAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof FETCH_TYPE;
    endpoint: E;
    meta: FetchMeta;
    payload: () => ReturnType<E>;
}
interface OptimisticAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof OPTIMISTIC_TYPE;
    endpoint: E;
    meta: SetMeta;
    error?: false;
}
interface SubscribeAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof SUBSCRIBE_TYPE;
    endpoint: E;
    meta: {
        args: readonly any[];
        key: string;
    };
}
interface UnsubscribeAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof UNSUBSCRIBE_TYPE;
    endpoint: E;
    meta: {
        args: readonly any[];
        key: string;
    };
}
interface ExpireAllAction {
    type: typeof EXPIREALL_TYPE;
    testKey: (key: string) => boolean;
}
interface InvalidateAllAction {
    type: typeof INVALIDATEALL_TYPE;
    testKey: (key: string) => boolean;
}
interface InvalidateAction {
    type: typeof INVALIDATE_TYPE;
    meta: {
        key: string;
    };
}
interface ResetAction {
    type: typeof RESET_TYPE;
    date: number;
}
interface GCAction {
    type: typeof GC_TYPE;
    entities: [string, string][];
    results: string[];
}
type ActionTypes = FetchAction | OptimisticAction | SetAction | SubscribeAction | UnsubscribeAction | InvalidateAction | InvalidateAllAction | ExpireAllAction | ResetAction | GCAction;

type PK = string;
interface State<T> {
    readonly entities: {
        readonly [entityKey: string]: {
            readonly [pk: string]: T;
        } | undefined;
    };
    readonly indexes: NormalizedIndex;
    readonly results: {
        readonly [key: string]: unknown | PK[] | PK | undefined;
    };
    readonly meta: {
        readonly [key: string]: {
            readonly date: number;
            readonly error?: ErrorTypes;
            readonly expiresAt: number;
            readonly prevExpiresAt?: number;
            readonly invalidated?: boolean;
            readonly errorPolicy?: 'hard' | 'soft' | undefined;
        };
    };
    readonly entityMeta: {
        readonly [entityKey: string]: {
            readonly [pk: string]: {
                readonly date: number;
                readonly expiresAt: number;
                readonly fetchedAt: number;
            };
        };
    };
    readonly optimistic: (SetAction | OptimisticAction)[];
    readonly lastReset: number;
}

type GenericDispatch = (value: any) => Promise<void>;
type DataClientDispatch = (value: ActionTypes) => Promise<void>;
interface ConstructorProps<D extends GenericDispatch = DataClientDispatch> {
    dispatch?: D;
    getState?: () => State<unknown>;
    globalCache?: DenormalizeCache;
}
/**
 * Imperative control of Reactive Data Client store
 * @see https://dataclient.io/docs/api/Controller
 */
declare class Controller<D extends GenericDispatch = DataClientDispatch> {
    /**
     * Dispatches an action to Reactive Data Client reducer.
     *
     * @see https://dataclient.io/docs/api/Controller#dispatch
     */
    readonly dispatch: D;
    /**
     * Gets the latest state snapshot that is fully committed.
     *
     * This can be useful for imperative use-cases like event handlers.
     * This should *not* be used to render; instead useSuspense() or useCache()
     * @see https://dataclient.io/docs/api/Controller#getState
     */
    readonly getState: () => State<unknown>;
    readonly globalCache: DenormalizeCache;
    constructor({ dispatch, getState, globalCache, }?: ConstructorProps<D>);
    /*************** Action Dispatchers ***************/
    /**
     * Fetches the endpoint with given args, updating the Reactive Data Client cache with the response or error upon completion.
     * @see https://dataclient.io/docs/api/Controller#fetch
     */
    fetch: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, ...args_0: Parameters<E>) => E["schema"] extends null | undefined ? ReturnType<E> : Promise<Denormalize<E["schema"]>>;
    /**
     * Fetches only if endpoint is considered 'stale'; otherwise returns undefined
     * @see https://dataclient.io/docs/api/Controller#fetchIfStale
     */
    fetchIfStale: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, ...args_0: Parameters<E>) => E["schema"] extends null | undefined ? ReturnType<E> | ResolveType<E> : Denormalize<E["schema"]> | Promise<Denormalize<E["schema"]>>;
    /**
     * Forces refetching and suspense on useSuspense with the same Endpoint and parameters.
     * @see https://dataclient.io/docs/api/Controller#invalidate
     */
    invalidate: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) => Promise<void>;
    /**
     * Forces refetching and suspense on useSuspense on all matching endpoint result keys.
     * @see https://dataclient.io/docs/api/Controller#invalidateAll
     * @returns Promise that resolves when invalidation is commited.
     */
    invalidateAll: (options: {
        testKey: (key: string) => boolean;
    }) => Promise<void>;
    /**
     * Sets all matching endpoint result keys to be STALE.
     * @see https://dataclient.io/docs/api/Controller#expireAll
     * @returns Promise that resolves when expiry is commited. *NOT* fetch promise
     */
    expireAll: (options: {
        testKey: (key: string) => boolean;
    }) => Promise<void>;
    /**
     * Resets the entire Reactive Data Client cache. All inflight requests will not resolve.
     * @see https://dataclient.io/docs/api/Controller#resetEntireStore
     */
    resetEntireStore: () => Promise<void>;
    /**
     * Stores response in cache for given Endpoint and args.
     * @see https://dataclient.io/docs/api/Controller#set
     */
    setResponse: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, any]) => Promise<void>;
    /**
     * Stores the result of Endpoint and args as the error provided.
     * @see https://dataclient.io/docs/api/Controller#setError
     */
    setError: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, Error]) => Promise<void>;
    /**
     * Resolves an inflight fetch. `fetchedAt` should `fetch`'s `createdAt`
     * @see https://dataclient.io/docs/api/Controller#resolve
     */
    resolve: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, meta: {
        args: readonly [...Parameters<E>];
        response: Error;
        fetchedAt: number;
        error: true;
    } | {
        args: readonly [...Parameters<E>];
        response: any;
        fetchedAt: number;
        error?: false | undefined;
    }) => Promise<void>;
    /**
     * Marks a new subscription to a given Endpoint.
     * @see https://dataclient.io/docs/api/Controller#subscribe
     */
    subscribe: <E extends EndpointInterface<FetchFunction, Schema | undefined, false | undefined>>(endpoint: E, ...args: readonly [null] | readonly [...Parameters<E>]) => Promise<void>;
    /**
     * Marks completion of subscription to a given Endpoint.
     * @see https://dataclient.io/docs/api/Controller#unsubscribe
     */
    unsubscribe: <E extends EndpointInterface<FetchFunction, Schema | undefined, false | undefined>>(endpoint: E, ...args: readonly [null] | readonly [...Parameters<E>]) => Promise<void>;
    /*************** More ***************/
    /**
     * Gets a snapshot (https://dataclient.io/docs/api/Snapshot)
     * @see https://dataclient.io/docs/api/Controller#snapshot
     */
    snapshot: (state: State<unknown>, fetchedAt?: number) => SnapshotInterface;
    /**
     * Gets the error, if any, for a given endpoint. Returns undefined for no errors.
     * @see https://dataclient.io/docs/api/Controller#getError
     */
    getError: <E extends Pick<EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined>, "key">, Args extends readonly [null] | readonly [...Parameters<E["key"]>]>(endpoint: E, ...rest: [...Args, State<unknown>]) => ErrorTypes | undefined;
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://dataclient.io/docs/api/Controller#getResponse
     */
    getResponse: <E extends Pick<EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined>, "schema" | "key" | "invalidIfStale">, Args extends readonly [null] | readonly [...Parameters<E["key"]>]>(endpoint: E, ...rest: [...Args, State<unknown>]) => {
        data: DenormalizeNullable<E["schema"]>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
}

export { Controller, DataClientDispatch, ErrorTypes, GenericDispatch };
