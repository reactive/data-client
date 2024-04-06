type Schema = null | string | {
    [K: string]: any;
} | Schema[] | SchemaSimple | Serializable;
interface Queryable {
    queryKey(args: readonly any[], queryKey: (...args: any) => any, lookupEntities: LookupEntities, lookupIndex: LookupIndex): {};
}
type Serializable<T extends {
    toJSON(): string;
} = {
    toJSON(): string;
}> = (value: any) => T;
interface SchemaSimple<T = any, Args extends any[] = any[]> {
    normalize(input: any, parent: any, key: any, visit: (...args: any) => any, addEntity: (...args: any) => any, visitedEntities: Record<string, any>, storeEntities: any, args: any[]): any;
    denormalize(input: {}, args: readonly any[], unvisit: (input: any, schema: any) => any): T;
    queryKey(args: Args, queryKey: (...args: any) => any, lookupEntities: LookupEntities, lookupIndex: LookupIndex): any;
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
interface NormalizedIndex {
    readonly [entityKey: string]: {
        readonly [indexName: string]: {
            readonly [lookup: string]: string;
        };
    };
}
/** Get Array of entities with map function applied */
interface LookupEntities {
    (entityKey: string): {
        readonly [pk: string]: any;
    } | undefined;
    (entityKey: string, pk: string | number): any;
}
/** Get PK using an Entity Index */
interface LookupIndex {
    /** lookupIndex('User', 'username', 'ntucker') */
    (entityKey: string, field: string, value: string): {
        readonly [indexKey: string]: string | undefined;
    };
}

/** Attempts to infer reasonable input type to construct an Entity */
type EntityFields<U> = {
    readonly [K in keyof U as U[K] extends (...args: any) => any ? never : K]?: U[K] extends number ? U[K] | string : U[K] extends string ? U[K] | number : U[K];
};

/** Maps a (ordered) list of dependencies to a value.
 *
 * Useful as a memoization cache for flat/normalized stores.
 *
 * All dependencies are only weakly referenced, allowing automatic garbage collection
 * when any dependencies are no longer used.
 */
declare class WeakDependencyMap<Path, K extends object = object, V = any> {
    private readonly next;
    private nextPath;
    get(entity: K, getDependency: GetDependency<Path, K | symbol>): readonly [undefined, undefined] | readonly [V, Path[]];
    set(dependencies: Dep<Path, K>[], value: V): void;
}
type GetDependency<Path, K = object | symbol> = (lookup: Path) => K;
interface Dep<Path, K = object> {
    path: Path;
    entity: K;
}

interface EntityPath {
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
type NormalizedNullableObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? NormalizeNullable<S[K]> : S[K];
};
interface NestedSchemaClass<T = any> {
    schema: Record<string, Schema>;
    prototype: T;
}
interface RecordClass<T = any> extends NestedSchemaClass<T> {
    fromJS: (...args: any) => AbstractInstanceType<T>;
}
interface EntityCache {
    [key: string]: {
        [pk: string]: WeakMap<EntityInterface, WeakDependencyMap<EntityPath, object, any>>;
    };
}
type EndpointsCache = WeakDependencyMap<EntityPath, object, any>;
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
type NormalizeNullable<S> = S extends EntityInterface ? string | undefined : S extends RecordClass ? NormalizedNullableObject<S['schema']> : S extends {
    _normalizeNullable: (...args: any) => any;
} ? NormalizeReturnType<S['_normalizeNullable']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Normalize<F>[] | undefined : S extends {
    [K: string]: any;
} ? NormalizedNullableObject<S> : S;
type SchemaArgs<S extends Queryable> = S extends EntityInterface<infer U> ? [EntityFields<U>] : S extends ({
    queryKey(args: infer Args, queryKey: (...args: any) => any, lookupEntities: any, lookupIndex: any): any;
}) ? Args : never;

/** Singleton to store the memoization cache for denormalization methods */
declare class MemoCache {
    /** Cache for every entity based on its dependencies and its own input */
    protected entities: EntityCache;
    /** Caches the final denormalized form based on input, entities */
    protected endpoints: EndpointsCache;
    /** Caches the queryKey based on schema, args, and any used entities or indexes */
    protected queryKeys: Record<string, WeakDependencyMap<QueryPath>>;
    /** Compute denormalized form maintaining referential equality for same inputs */
    denormalize<S extends Schema>(input: unknown, schema: S | undefined, entities: any, args?: readonly any[]): {
        data: DenormalizeNullable<S> | symbol;
        paths: EntityPath[];
    };
    /** Compute denormalized form maintaining referential equality for same inputs */
    query<S extends Schema>(argsKey: string, schema: S, args: any[], entities: Record<string, Record<string, object>> | {
        getIn(k: string[]): any;
    }, indexes: NormalizedIndex | {
        getIn(k: string[]): any;
    }): {
        data: DenormalizeNullable<S> | undefined;
        paths: EntityPath[];
        isInvalid: boolean;
    };
    buildQueryKey<S extends Schema>(argsKey: string, schema: S, args: any[], entities: Record<string, Record<string, object>> | {
        getIn(k: string[]): any;
    }, indexes: NormalizedIndex | {
        getIn(k: string[]): any;
    }): NormalizeNullable<S>;
}
type IndexPath = [key: string, field: string, value: string];
type EntitySchemaPath = [key: string] | [key: string, pk: string];
type QueryPath = IndexPath | EntitySchemaPath;

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
type UpdateFunction<SourceSchema extends Schema | undefined, DestSchema extends Schema> = (sourceResults: Normalize<SourceSchema>, destResults: Normalize<DestSchema> | undefined) => Normalize<DestSchema>;

type FetchFunction<A extends readonly any[] = any, R = any> = (...args: A) => Promise<R>;

declare const INVALID: unique symbol;

declare const RIC: (cb: (...args: any[]) => void, options: any) => void;
//# sourceMappingURL=RIC.d.ts.map

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

declare const actionTypes_d_FETCH_TYPE: typeof FETCH_TYPE;
declare const actionTypes_d_SET_TYPE: typeof SET_TYPE;
declare const actionTypes_d_OPTIMISTIC_TYPE: typeof OPTIMISTIC_TYPE;
declare const actionTypes_d_RESET_TYPE: typeof RESET_TYPE;
declare const actionTypes_d_SUBSCRIBE_TYPE: typeof SUBSCRIBE_TYPE;
declare const actionTypes_d_UNSUBSCRIBE_TYPE: typeof UNSUBSCRIBE_TYPE;
declare const actionTypes_d_INVALIDATE_TYPE: typeof INVALIDATE_TYPE;
declare const actionTypes_d_INVALIDATEALL_TYPE: typeof INVALIDATEALL_TYPE;
declare const actionTypes_d_EXPIREALL_TYPE: typeof EXPIREALL_TYPE;
declare const actionTypes_d_GC_TYPE: typeof GC_TYPE;
declare namespace actionTypes_d {
  export {
    actionTypes_d_FETCH_TYPE as FETCH_TYPE,
    actionTypes_d_SET_TYPE as SET_TYPE,
    actionTypes_d_OPTIMISTIC_TYPE as OPTIMISTIC_TYPE,
    actionTypes_d_RESET_TYPE as RESET_TYPE,
    actionTypes_d_SUBSCRIBE_TYPE as SUBSCRIBE_TYPE,
    actionTypes_d_UNSUBSCRIBE_TYPE as UNSUBSCRIBE_TYPE,
    actionTypes_d_INVALIDATE_TYPE as INVALIDATE_TYPE,
    actionTypes_d_INVALIDATEALL_TYPE as INVALIDATEALL_TYPE,
    actionTypes_d_EXPIREALL_TYPE as EXPIREALL_TYPE,
    actionTypes_d_GC_TYPE as GC_TYPE,
  };
}

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
    endpoints: string[];
}
type ActionTypes = FetchAction | OptimisticAction | SetAction | SubscribeAction | UnsubscribeAction | InvalidateAction | InvalidateAllAction | ExpireAllAction | ResetAction | GCAction;

type RHDispatch<Actions = any> = (value: Actions) => Promise<void>;
interface MiddlewareAPI$1<R extends DataClientReducer = DataClientReducer> extends Controller<RHDispatch<ActionTypes>> {
}
interface MiddlewareController<Actions = ActionTypes> extends Controller<RHDispatch<Actions>> {
}
type Middleware$2<Actions = any> = <C extends MiddlewareController<Actions>>(controller: C) => (next: C['dispatch']) => C['dispatch'];
type DataClientReducer = (prevState: State<unknown>, action: ActionTypes) => State<unknown>;
type Dispatch$1<R extends Reducer<any, any>> = (action: ReducerAction<R>) => Promise<void>;
type Reducer<S, A> = (prevState: S, action: A) => S;
type ReducerState<R extends Reducer<any, any>> = R extends Reducer<infer S, any> ? S : never;
type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<any, infer A> ? A : never;

type SetTypes = typeof SET_TYPE;
type PK = string;
interface State<T> {
    readonly entities: {
        readonly [entityKey: string]: {
            readonly [pk: string]: T;
        } | undefined;
    };
    readonly indexes: NormalizedIndex;
    readonly endpoints: {
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

interface Manager<Actions = ActionTypes> {
    getMiddleware(): Middleware$2<Actions>;
    cleanup(): void;
    init?: (state: State<any>) => void;
}

type GenericDispatch = (value: any) => Promise<void>;
type DataClientDispatch = (value: ActionTypes) => Promise<void>;
interface ConstructorProps<D extends GenericDispatch = DataClientDispatch> {
    dispatch?: D;
    getState?: () => State<unknown>;
    globalCache?: Pick<MemoCache, 'denormalize' | 'query' | 'buildQueryKey'>;
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
    /**
     * Singleton to maintain referential equality between calls
     */
    readonly globalCache: Pick<MemoCache, 'denormalize' | 'query' | 'buildQueryKey'>;
    constructor({ dispatch, getState, globalCache, }?: ConstructorProps<D>);
    /*************** Action Dispatchers ***************/
    /**
     * Fetches the endpoint with given args, updating the Reactive Data Client cache with the response or error upon completion.
     * @see https://dataclient.io/docs/api/Controller#fetch
     */
    fetch: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, ...args_0: Parameters<E>) => E['schema'] extends undefined | null ? ReturnType<E> : Promise<Denormalize<E['schema']>>;
    /**
     * Fetches only if endpoint is considered 'stale'; otherwise returns undefined
     * @see https://dataclient.io/docs/api/Controller#fetchIfStale
     */
    fetchIfStale: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, ...args_0: Parameters<E>) => E['schema'] extends undefined | null ? ReturnType<E> | ResolveType<E> : Promise<Denormalize<E['schema']>> | Denormalize<E['schema']>;
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
    subscribe: <E extends EndpointInterface<FetchFunction, Schema | undefined, false | undefined>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) => Promise<void>;
    /**
     * Marks completion of subscription to a given Endpoint.
     * @see https://dataclient.io/docs/api/Controller#unsubscribe
     */
    unsubscribe: <E extends EndpointInterface<FetchFunction, Schema | undefined, false | undefined>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) => Promise<void>;
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
    getResponse<E extends EndpointInterface>(endpoint: E, ...rest: readonly [null, State<unknown>]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    getResponse<E extends EndpointInterface>(endpoint: E, ...rest: readonly [...Parameters<E>, State<unknown>]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    getResponse<E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...rest: readonly [
        ...(readonly [...Parameters<E['key']>] | readonly [null]),
        State<unknown>
    ]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    /**
     * Queries the store for a Querable schema
     * @see https://dataclient.io/docs/api/Controller#get
     */
    get<S extends Queryable>(schema: S, ...rest: readonly [
        ...SchemaArgs<S>,
        Pick<State<unknown>, 'entities' | 'entityMeta'>
    ]): DenormalizeNullable<S> | undefined;
    private getSchemaResponse;
}

declare function createReducer(controller: Controller): ReducerType;
declare const initialState: State<unknown>;
type ReducerType = (state: State<unknown> | undefined, action: ActionTypes) => State<unknown>;

//# sourceMappingURL=internal.d.ts.map

type internal_d_MemoCache = MemoCache;
declare const internal_d_MemoCache: typeof MemoCache;
declare const internal_d_INVALID: typeof INVALID;
declare const internal_d_RIC: typeof RIC;
declare const internal_d_initialState: typeof initialState;
declare namespace internal_d {
  export {
    internal_d_MemoCache as MemoCache,
    internal_d_INVALID as INVALID,
    internal_d_RIC as RIC,
    internal_d_initialState as initialState,
  };
}

declare class ResetError extends Error {
    name: string;
    constructor();
}
/** Handles all async network dispatches
 *
 * Dedupes concurrent requests by keeping track of all fetches in flight
 * and returning existing promises for requests already in flight.
 *
 * Interfaces with store via a redux-compatible middleware.
 *
 * @see https://dataclient.io/docs/api/NetworkManager
 */
declare class NetworkManager implements Manager {
    protected fetched: {
        [k: string]: Promise<any>;
    };
    protected resolvers: {
        [k: string]: (value?: any) => void;
    };
    protected rejectors: {
        [k: string]: (value?: any) => void;
    };
    protected fetchedAt: {
        [k: string]: number;
    };
    readonly dataExpiryLength: number;
    readonly errorExpiryLength: number;
    protected middleware: Middleware$2;
    protected controller: Controller;
    cleanupDate?: number;
    constructor(dataExpiryLength?: number, errorExpiryLength?: number);
    /** Used by DevtoolsManager to determine whether to log an action */
    skipLogging(action: ActionTypes): boolean;
    /** On mount */
    init(): void;
    /** Ensures all promises are completed by rejecting remaining. */
    cleanup(): void;
    allSettled(): Promise<PromiseSettledResult<any>[]> | undefined;
    /** Clear all promise state */
    protected clearAll(): void;
    /** Clear promise state for a given key */
    protected clear(key: string): void;
    protected getLastReset(): number;
    /** Called when middleware intercepts 'rdc/fetch' action.
     *
     * Will then start a promise for a key and potentially start the network
     * fetch.
     *
     * Uses throttle only when instructed by action meta. This is valuable
     * for ensures mutation requests always go through.
     */
    protected handleFetch(action: FetchAction): Promise<any>;
    /** Called when middleware intercepts a set action.
     *
     * Will resolve the promise associated with set key.
     */
    protected handleSet(action: SetAction): void;
    /** Attaches NetworkManager to store
     *
     * Intercepts 'rdc/fetch' actions to start requests.
     *
     * Resolve/rejects a request when matching 'rdc/set' event
     * is seen.
     */
    getMiddleware(): Middleware$2;
    /** Ensures only one request for a given key is in flight at any time
     *
     * Uses key to either retrieve in-flight promise, or if not
     * create a new promise and call fetch.
     *
     * Note: The new promise is not actually tied to fetch at all,
     * but is resolved when the expected 'recieve' action is processed.
     * This ensures promises are resolved only once their data is processed
     * by the reducer.
     */
    protected throttle(key: string, fetch: () => Promise<any>, createdAt: number): Promise<any>;
}

declare function applyManager(managers: Manager[], controller: Controller): Middleware$1[];
interface MiddlewareAPI<R extends Reducer<any, any> = Reducer<any, any>> {
    getState: () => ReducerState<R>;
    dispatch: Dispatch$1<R>;
}
type Middleware$1 = <R extends Reducer<any, any>>({ dispatch, }: MiddlewareAPI<R>) => (next: Dispatch$1<R>) => Dispatch$1<R>;

/**
 * Requesting a fetch to begin
 */
declare function createFetch<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
}>(endpoint: E, { args }: {
    args: readonly [...Parameters<E>];
}): FetchAction<E>;

declare function createSet<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
}>(endpoint: E, options: {
    args: readonly [...Parameters<E>];
    response: Error;
    fetchedAt?: number;
    error: true;
}): SetAction<E>;
declare function createSet<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
}>(endpoint: E, options: {
    args: readonly [...Parameters<E>];
    response: ResolveType<E>;
    fetchedAt?: number;
    error?: false;
}): SetAction<E>;

interface ConnectionListener {
    isOnline: () => boolean;
    addOnlineListener: (handler: () => void) => void;
    removeOnlineListener: (handler: () => void) => void;
    addOfflineListener: (handler: () => void) => void;
    removeOfflineListener: (handler: () => void) => void;
}

declare let DefaultConnectionListener: {
    new (): ConnectionListener;
};

type Actions = UnsubscribeAction | SubscribeAction;
/** Interface handling a single resource subscription */
interface Subscription {
    add(frequency?: number): void;
    remove(frequency?: number): boolean;
    cleanup(): void;
}
/** The static class that constructs Subscription */
interface SubscriptionConstructable {
    new (action: Omit<SubscribeAction, 'type'>, controller: Controller): Subscription;
}
/** Handles subscription actions -> fetch or set actions
 *
 * Constructor takes a SubscriptionConstructable class to control how
 * subscriptions are handled. (e.g., polling, websockets)
 *
 * @see https://dataclient.io/docs/api/SubscriptionManager
 */
declare class SubscriptionManager<S extends SubscriptionConstructable> implements Manager<Actions> {
    protected subscriptions: {
        [key: string]: InstanceType<S>;
    };
    protected readonly Subscription: S;
    protected middleware: Middleware$2;
    protected controller: Controller;
    constructor(Subscription: S);
    /** Ensures all subscriptions are cleaned up. */
    cleanup(): void;
    /** Called when middleware intercepts 'rdc/subscribe' action.
     *
     */
    protected handleSubscribe(action: SubscribeAction): void;
    /** Called when middleware intercepts 'rdc/unsubscribe' action.
     *
     */
    protected handleUnsubscribe(action: UnsubscribeAction): void;
    /** Attaches Manager to store
     *
     * Intercepts 'rdc/subscribe'/'rest-hordc/ribe' to register resources that
     * need to be kept up to date.
     *
     * Will possibly dispatch 'rdc/fetch' or 'rest-hordc/' to keep resources fresh
     *
     */
    getMiddleware(): Middleware$2;
}

/**
 * PollingSubscription keeps a given resource updated by
 * dispatching a fetch at a rate equal to the minimum update
 * interval requested.
 *
 * @see https://dataclient.io/docs/api/PollingSubscription
 */
declare class PollingSubscription implements Subscription {
    protected readonly endpoint: EndpointInterface;
    protected readonly args: readonly any[];
    protected readonly key: string;
    protected frequency: number;
    protected frequencyHistogram: Map<number, number>;
    protected controller: Controller;
    protected intervalId?: ReturnType<typeof setInterval>;
    protected lastIntervalId?: ReturnType<typeof setInterval>;
    protected startId?: ReturnType<typeof setTimeout>;
    private connectionListener;
    constructor(action: Omit<SubscribeAction, 'type'>, controller: Controller, connectionListener?: ConnectionListener);
    /** Subscribe to a frequency */
    add(frequency?: number): void;
    /** Unsubscribe from a frequency */
    remove(frequency?: number): boolean;
    /** Cleanup means clearing out background interval. */
    cleanup(): void;
    /** Trigger request for latest resource */
    protected update(): void;
    /** What happens when browser goes offline */
    protected offlineListener: () => void;
    /** What happens when browser comes online */
    protected onlineListener: () => void;
    /** Run polling process with current frequency
     *
     * Will clean up old poll interval on next run
     */
    protected run(): void;
    /** Last fetch time */
    protected lastFetchTime(): number;
}

type Action = any;
type ActionCreator<T> = any;
interface EnhancerOptions {
    /**
     * the instance name to be showed on the monitor page. Default value is `document.title`.
     * If not specified and there's no document title, it will consist of `tabId` and `instanceId`.
     */
    name?: string;
    /**
     * action creators functions to be available in the Dispatcher.
     */
    actionCreators?: ActionCreator<any>[] | {
        [key: string]: ActionCreator<any>;
    };
    /**
     * if more than one action is dispatched in the indicated interval, all new actions will be collected and sent at once.
     * It is the joint between performance and speed. When set to `0`, all actions will be sent instantly.
     * Set it to a higher value when experiencing perf issues (also `maxAge` to a lower value).
     *
     * @default 500 ms.
     */
    latency?: number;
    /**
     * (> 1) - maximum allowed actions to be stored in the history tree. The oldest actions are removed once maxAge is reached. It's critical for performance.
     *
     * @default 50
     */
    maxAge?: number;
    /**
     * Customizes how actions and state are serialized and deserialized. Can be a boolean or object. If given a boolean, the behavior is the same as if you
     * were to pass an object and specify `options` as a boolean. Giving an object allows fine-grained customization using the `replacer` and `reviver`
     * functions.
     */
    serialize?: boolean | {
        /**
         * - `undefined` - will use regular `JSON.stringify` to send data (it's the fast mode).
         * - `false` - will handle also circular references.
         * - `true` - will handle also date, regex, undefined, error objects, symbols, maps, sets and functions.
         * - object, which contains `date`, `regex`, `undefined`, `error`, `symbol`, `map`, `set` and `function` keys.
         *   For each of them you can indicate if to include (by setting as `true`).
         *   For `function` key you can also specify a custom function which handles serialization.
         *   See [`jsan`](https://github.com/kolodny/jsan) for more details.
         */
        options?: undefined | boolean | {
            date?: true;
            regex?: true;
            undefined?: true;
            error?: true;
            symbol?: true;
            map?: true;
            set?: true;
            function?: true | ((fn: (...args: any[]) => any) => string);
        };
        /**
         * [JSON replacer function](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_replacer_parameter) used for both actions and states stringify.
         * In addition, you can specify a data type by adding a [`__serializedType__`](https://github.com/zalmoxisus/remotedev-serialize/blob/master/helpers/index.js#L4)
         * key. So you can deserialize it back while importing or persisting data.
         * Moreover, it will also [show a nice preview showing the provided custom type](https://cloud.githubusercontent.com/assets/7957859/21814330/a17d556a-d761-11e6-85ef-159dd12f36c5.png):
         */
        replacer?: (key: string, value: unknown) => any;
        /**
         * [JSON `reviver` function](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#Using_the_reviver_parameter)
         * used for parsing the imported actions and states. See [`remotedev-serialize`](https://github.com/zalmoxisus/remotedev-serialize/blob/master/immutable/serialize.js#L8-L41)
         * as an example on how to serialize special data types and get them back.
         */
        reviver?: (key: string, value: unknown) => any;
    };
    /**
     * function which takes `action` object and id number as arguments, and should return `action` object back.
     */
    actionSanitizer?: <A extends Action>(action: A, id: number) => A;
    /**
     * function which takes `state` object and index as arguments, and should return `state` object back.
     */
    stateSanitizer?: <S>(state: S, index: number) => S;
    /**
     * *string or array of strings as regex* - actions types to be hidden / shown in the monitors (while passed to the reducers).
     * If `actionsWhitelist` specified, `actionsBlacklist` is ignored.
     * @deprecated Use actionsDenylist instead.
     */
    actionsBlacklist?: string | string[];
    /**
     * *string or array of strings as regex* - actions types to be hidden / shown in the monitors (while passed to the reducers).
     * If `actionsWhitelist` specified, `actionsBlacklist` is ignored.
     * @deprecated Use actionsAllowlist instead.
     */
    actionsWhitelist?: string | string[];
    /**
     * *string or array of strings as regex* - actions types to be hidden / shown in the monitors (while passed to the reducers).
     * If `actionsAllowlist` specified, `actionsDenylist` is ignored.
     */
    actionsDenylist?: string | string[];
    /**
     * *string or array of strings as regex* - actions types to be hidden / shown in the monitors (while passed to the reducers).
     * If `actionsAllowlist` specified, `actionsDenylist` is ignored.
     */
    actionsAllowlist?: string | string[];
    /**
     * called for every action before sending, takes `state` and `action` object, and returns `true` in case it allows sending the current data to the monitor.
     * Use it as a more advanced version of `actionsDenylist`/`actionsAllowlist` parameters.
     */
    predicate?: <S, A extends Action>(state: S, action: A) => boolean;
    /**
     * if specified as `false`, it will not record the changes till clicking on `Start recording` button.
     * Available only for Redux enhancer, for others use `autoPause`.
     *
     * @default true
     */
    shouldRecordChanges?: boolean;
    /**
     * if specified, whenever clicking on `Pause recording` button and there are actions in the history log, will add this action type.
     * If not specified, will commit when paused. Available only for Redux enhancer.
     *
     * @default "@@PAUSED""
     */
    pauseActionType?: string;
    /**
     * auto pauses when the extension’s window is not opened, and so has zero impact on your app when not in use.
     * Not available for Redux enhancer (as it already does it but storing the data to be sent).
     *
     * @default false
     */
    autoPause?: boolean;
    /**
     * if specified as `true`, it will not allow any non-monitor actions to be dispatched till clicking on `Unlock changes` button.
     * Available only for Redux enhancer.
     *
     * @default false
     */
    shouldStartLocked?: boolean;
    /**
     * if set to `false`, will not recompute the states on hot reloading (or on replacing the reducers). Available only for Redux enhancer.
     *
     * @default true
     */
    shouldHotReload?: boolean;
    /**
     * if specified as `true`, whenever there's an exception in reducers, the monitors will show the error message, and next actions will not be dispatched.
     *
     * @default false
     */
    shouldCatchErrors?: boolean;
    /**
     * If you want to restrict the extension, specify the features you allow.
     * If not specified, all of the features are enabled. When set as an object, only those included as `true` will be allowed.
     * Note that except `true`/`false`, `import` and `export` can be set as `custom` (which is by default for Redux enhancer), meaning that the importing/exporting occurs on the client side.
     * Otherwise, you'll get/set the data right from the monitor part.
     */
    features?: {
        /**
         * start/pause recording of dispatched actions
         */
        pause?: boolean;
        /**
         * lock/unlock dispatching actions and side effects
         */
        lock?: boolean;
        /**
         * persist states on page reloading
         */
        persist?: boolean;
        /**
         * export history of actions in a file
         */
        export?: boolean | 'custom';
        /**
         * import history of actions from a file
         */
        import?: boolean | 'custom';
        /**
         * jump back and forth (time travelling)
         */
        jump?: boolean;
        /**
         * skip (cancel) actions
         */
        skip?: boolean;
        /**
         * drag and drop actions in the history list
         */
        reorder?: boolean;
        /**
         * dispatch custom actions or action creators
         */
        dispatch?: boolean;
        /**
         * generate tests for the selected actions
         */
        test?: boolean;
    };
    /**
     * Set to true or a stacktrace-returning function to record call stack traces for dispatched actions.
     * Defaults to false.
     */
    trace?: boolean | (<A extends Action>(action: A) => string);
    /**
     * The maximum number of stack trace entries to record per action. Defaults to 10.
     */
    traceLimit?: number;
}
interface DevToolsConfig extends EnhancerOptions {
    type?: string;
}

/** Handling network unauthorized indicators like HTTP 401
 *
 * @see https://dataclient.io/docs/api/LogoutManager
 */
declare class LogoutManager implements Manager {
    protected middleware: Middleware;
    constructor({ handleLogout, shouldLogout }?: Props);
    cleanup(): void;
    getMiddleware(): Middleware;
    protected shouldLogout(error: UnknownError): boolean;
    handleLogout(controller: Controller<Dispatch>): void;
}
type Dispatch = (value: ActionTypes) => Promise<void>;
type Middleware = <C extends Controller<Dispatch>>(controller: C) => (next: C['dispatch']) => C['dispatch'];
type HandleLogout = (controller: Controller<Dispatch>) => void;
interface Props {
    handleLogout?: HandleLogout;
    shouldLogout?: (error: UnknownError) => boolean;
}

/** Integrates with https://github.com/reduxjs/redux-devtools
 *
 * Options: https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md
 *
 * @see https://dataclient.io/docs/api/DevToolsManager
 */
declare class DevToolsManager implements Manager {
    protected middleware: Middleware;
    protected devTools: undefined | any;
    protected started: boolean;
    protected actions: [ActionTypes, State<unknown>][];
    protected controller: Controller;
    maxBufferLength: number;
    constructor(config?: DevToolsConfig, skipLogging?: (action: ActionTypes) => boolean);
    handleAction(action: any, state: any): void;
    /** Called when initial state is ready */
    init(state: State<any>): void;
    /** Ensures all subscriptions are cleaned up. */
    cleanup(): void;
    /** Attaches Manager to store
     *
     */
    getMiddleware(): Middleware;
}

export { AbstractInstanceType, ActionTypes, ConnectionListener, Controller, DataClientDispatch, DefaultConnectionListener, Denormalize, DenormalizeNullable, DevToolsConfig, DevToolsManager, Dispatch$1 as Dispatch, EndpointExtraOptions, EndpointInterface, EndpointUpdateFunction, EndpointsCache, EntityCache, EntityInterface, ErrorTypes, ExpireAllAction, ExpiryStatus, FetchAction, FetchFunction, FetchMeta, GCAction, GenericDispatch, InvalidateAction, InvalidateAllAction, LogoutManager, Manager, Middleware$2 as Middleware, MiddlewareAPI$1 as MiddlewareAPI, NetworkError, NetworkManager, Normalize, NormalizeNullable, OptimisticAction, PK, PollingSubscription, Queryable, ResetAction, ResetError, ResolveType, ResultEntry, Schema, SchemaArgs, SetAction, SetActionError, SetActionSuccess, SetMeta, SetTypes, State, SubscribeAction, SubscriptionManager, UnknownError, UnsubscribeAction, UpdateFunction, internal_d as __INTERNAL__, actionTypes_d as actionTypes, applyManager, createFetch, createReducer, createSet, initialState };
