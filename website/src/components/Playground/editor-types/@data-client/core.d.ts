type Schema = null | string | {
    [K: string]: any;
} | Schema[] | SchemaSimple | Serializable;
interface Queryable<Args extends readonly any[] = readonly any[]> {
    queryKey(args: Args, unvisit: (...args: any) => any, delegate: {
        getEntity: any;
        getIndex: any;
    }): {};
}
type Serializable<T extends {
    toJSON(): string;
} = {
    toJSON(): string;
}> = (value: any) => T;
interface SchemaSimple<T = any, Args extends readonly any[] = any[]> {
    normalize(input: any, parent: any, key: any, args: any[], visit: (...args: any) => any, delegate: {
        getEntity: any;
        setEntity: any;
    }): any;
    denormalize(input: {}, args: readonly any[], unvisit: (schema: any, input: any) => any): T;
    queryKey(args: Args, unvisit: (...args: any) => any, delegate: {
        getEntity: any;
        getIndex: any;
    }): any;
}
interface SchemaClass<T = any, Args extends readonly any[] = any[]> extends SchemaSimple<T, Args> {
    _normalizeNullable(): any;
    _denormalizeNullable(): any;
}
interface EntityInterface<T = any> extends SchemaSimple {
    createIfValid(props: any): any;
    pk(params: any, parent: any, key: string | undefined, args: readonly any[]): string | number | undefined;
    readonly key: string;
    indexes?: any;
    schema: Record<string, Schema>;
    prototype: T;
    cacheWith?: object;
}
interface Mergeable {
    key: string;
    merge(existing: any, incoming: any): any;
    mergeWithStore(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
    mergeMetaWithStore(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
}
interface NormalizedIndex {
    readonly [entityKey: string]: {
        readonly [indexName: string]: {
            readonly [lookup: string]: string;
        };
    };
}
/** Used in denormalize. Lookup to find an entity in the store table */
interface EntityPath {
    key: string;
    pk: string;
}
type IndexPath = [key: string, index: string, value: string];
type EntitiesPath = [key: string];
type QueryPath = IndexPath | [key: string, pk: string] | EntitiesPath;
/** Interface specification for entities state accessor */
interface EntitiesInterface {
    keys(): IterableIterator<string>;
    entries(): IterableIterator<[string, any]>;
}
/** Get normalized Entity from store */
interface GetEntity {
    (key: string, pk: string): any;
}
/** Get PK using an Entity Index */
interface GetIndex {
    /** getIndex('User', 'username', 'ntucker') */
    (...path: IndexPath): string | undefined;
}
/** Accessors to the currently processing state while building query */
interface IQueryDelegate {
    /** Get all entities for a given schema key */
    getEntities(key: string): EntitiesInterface | undefined;
    /** Gets any previously normalized entity from store */
    getEntity: GetEntity;
    /** Get PK using an Entity Index */
    getIndex: GetIndex;
    /** Return to consider results invalid */
    INVALID: symbol;
}
/** Helpers during schema.normalize() */
interface INormalizeDelegate {
    /** Action meta-data for this normalize call */
    readonly meta: {
        fetchedAt: number;
        date: number;
        expiresAt: number;
    };
    /** Get all entities for a given schema key */
    getEntities(key: string): EntitiesInterface | undefined;
    /** Gets any previously normalized entity from store */
    getEntity: GetEntity;
    /** Updates an entity using merge lifecycles when it has previously been set */
    mergeEntity(schema: Mergeable & {
        indexes?: any;
    }, pk: string, incomingEntity: any): void;
    /** Sets an entity overwriting any previously set values */
    setEntity(schema: {
        key: string;
        indexes?: any;
    }, pk: string, entity: any, meta?: {
        fetchedAt: number;
        date: number;
        expiresAt: number;
    }): void;
    /** Invalidates an entity, potentially triggering suspense */
    invalidate(schema: {
        key: string;
    }, pk: string): void;
    /** Returns true when we're in a cycle, so we should not continue recursing */
    checkLoop(key: string, pk: string, input: object): boolean;
}

/** Attempts to infer reasonable input type to construct an Entity */
type EntityFields<U> = {
    readonly [K in keyof U as U[K] extends (...args: any) => any ? never : K]?: U[K] extends number ? U[K] | string : U[K] extends string ? U[K] | number : U[K];
};

type SchemaArgs<S extends Schema> = S extends {
    createIfValid: any;
    pk: any;
    key: string;
    prototype: infer U;
} ? [
    EntityFields<U>
] : S extends ({
    queryKey(args: infer Args, ...rest: any): any;
}) ? Args : S extends {
    [K: string]: any;
} ? ObjectArgs<S> : never;
type ObjectArgs<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? SchemaArgs<S[K]> : never;
}[keyof S];

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
type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> = keyof S['schema'] extends never ? S['prototype'] : string extends keyof S['schema'] ? S['prototype'] : S['prototype'];
type NormalizeReturnType<T> = T extends (...args: any) => infer R ? R : never;
type Denormalize<S> = S extends {
    createIfValid: any;
    pk: any;
    key: string;
    prototype: infer U;
} ? U : S extends RecordClass ? AbstractInstanceType<S> : S extends {
    denormalize: (...args: any) => any;
} ? ReturnType<S['denormalize']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Denormalize<F>[] : S extends {
    [K: string]: any;
} ? DenormalizeObject<S> : S;
type DenormalizeNullable<S> = S extends ({
    createIfValid: any;
    pk: any;
    key: string;
    prototype: any;
    schema: any;
}) ? DenormalizeNullableNestedSchema<S> | undefined : S extends RecordClass ? DenormalizeNullableNestedSchema<S> : S extends {
    _denormalizeNullable: (...args: any) => any;
} ? ReturnType<S['_denormalizeNullable']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Denormalize<F>[] | undefined : S extends {
    [K: string]: any;
} ? DenormalizeNullableObject<S> : S;
type Normalize<S> = S extends {
    createIfValid: any;
    pk: any;
    key: string;
    prototype: {};
} ? string : S extends RecordClass ? NormalizeObject<S['schema']> : S extends {
    normalize: (...args: any) => any;
} ? NormalizeReturnType<S['normalize']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Normalize<F>[] : S extends {
    [K: string]: any;
} ? NormalizeObject<S> : S;
type NormalizeNullable<S> = S extends {
    createIfValid: any;
    pk: any;
    key: string;
    prototype: {};
} ? string | undefined : S extends RecordClass ? NormalizedNullableObject<S['schema']> : S extends {
    _normalizeNullable: (...args: any) => any;
} ? NormalizeReturnType<S['_normalizeNullable']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Normalize<F>[] | undefined : S extends {
    [K: string]: any;
} ? NormalizedNullableObject<S> : S;

declare const INVALID: unique symbol;

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
type GetDependency<Path, K = object | symbol> = (lookup: Path) => K | undefined;
interface Dep<Path, K = object> {
    path: Path;
    entity: K | undefined;
}

/** Basic state interfaces for normalize side */
declare abstract class BaseDelegate {
    entities: any;
    indexes: any;
    constructor({ entities, indexes }: {
        entities: any;
        indexes: any;
    });
    abstract getEntities(key: string): EntitiesInterface | undefined;
    abstract getEntity(key: string, pk: string): object | undefined;
    abstract getIndex(...path: IndexPath): object | undefined;
    abstract getIndexEnd(entity: any, value: string): string | undefined;
    protected abstract getEntitiesObject(key: string): object | undefined;
    tracked(schema: any): [delegate: IQueryDelegate, dependencies: Dep<QueryPath>[]];
}

type EndpointsCache = WeakDependencyMap<EntityPath, object, any>;
type DenormGetEntity = GetDependency<EntityPath>;
interface IMemoPolicy {
    QueryDelegate: new (v: {
        entities: any;
        indexes: any;
    }) => BaseDelegate;
    getEntities(entities: any): DenormGetEntity;
}

type GetEntityCache = (pk: string, schema: EntityInterface) => WeakDependencyMap<EntityPath, object, any>;

/** Singleton to store the memoization cache for denormalization methods */
declare class MemoCache {
    /** Cache for every entity based on its dependencies and its own input */
    protected _getCache: GetEntityCache;
    /** Caches the final denormalized form based on input, entities */
    protected endpoints: EndpointsCache;
    /** Caches the queryKey based on schema, args, and any used entities or indexes */
    protected queryKeys: Map<string, WeakDependencyMap<QueryPath>>;
    protected policy: IMemoPolicy;
    constructor(policy?: IMemoPolicy);
    /** Compute denormalized form maintaining referential equality for same inputs */
    denormalize<S extends Schema>(schema: S | undefined, input: unknown, entities: any, args?: readonly any[]): {
        data: DenormalizeNullable<S> | typeof INVALID;
        paths: EntityPath[];
    };
    /** Compute denormalized form maintaining referential equality for same inputs */
    query<S extends Schema>(schema: S, args: readonly any[], state: StateInterface, argsKey?: string): {
        data: DenormalizeNullable<S> | typeof INVALID;
        paths: EntityPath[];
    };
    buildQueryKey<S extends Schema>(schema: S, args: readonly any[], state: StateInterface, argsKey?: string): NormalizeNullable<S>;
}
type StateInterface = {
    entities: Record<string, Record<string, any> | undefined> | {
        getIn(k: string[]): any;
    };
    indexes: NormalizedIndex | {
        getIn(k: string[]): any;
    };
};

/** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html#the-noinfer-utility-type */
type NI<T> = NoInfer<T>;

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
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://dataclient.io/docs/api/Snapshot#getResponseMeta
     */
    getResponseMeta<E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...args: readonly any[]): {
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
    /**
     * Queries the store for a Querable schema; providing related metadata
     * @see https://dataclient.io/docs/api/Snapshot#getQueryMeta
     */
    getQueryMeta<S extends Queryable>(schema: S, ...args: readonly any[]): {
        data: any;
        countRef: () => () => void;
    };
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

declare class AbortOptimistic extends Error {
}

type ResultEntry<E extends EndpointInterface> = E['schema'] extends undefined | null ? ResolveType<E> : Normalize<E['schema']>;
type EndpointUpdateFunction<Source extends EndpointInterface, Updaters extends Record<string, any> = Record<string, any>> = (source: ResultEntry<Source>, ...args: any) => {
    [K in keyof Updaters]: (result: Updaters[K]) => Updaters[K];
};

declare const FETCH: "rdc/fetch";
declare const SET: "rdc/set";
declare const SET_RESPONSE: "rdc/setresponse";
declare const OPTIMISTIC: "rdc/optimistic";
declare const RESET: "rdc/reset";
declare const SUBSCRIBE: "rdc/subscribe";
declare const UNSUBSCRIBE: "rdc/unsubscribe";
declare const INVALIDATE: "rdc/invalidate";
declare const INVALIDATEALL: "rdc/invalidateall";
declare const EXPIREALL: "rdc/expireall";
declare const GC: "rdc/gc";
declare const FETCH_TYPE: "rdc/fetch";
declare const SET_TYPE: "rdc/set";
declare const SET_RESPONSE_TYPE: "rdc/setresponse";
declare const OPTIMISTIC_TYPE: "rdc/optimistic";
declare const RESET_TYPE: "rdc/reset";
declare const SUBSCRIBE_TYPE: "rdc/subscribe";
declare const UNSUBSCRIBE_TYPE: "rdc/unsubscribe";
declare const INVALIDATE_TYPE: "rdc/invalidate";
declare const INVALIDATEALL_TYPE: "rdc/invalidateall";
declare const EXPIREALL_TYPE: "rdc/expireall";
declare const GC_TYPE: "rdc/gc";

declare const actionTypes_d_EXPIREALL: typeof EXPIREALL;
declare const actionTypes_d_EXPIREALL_TYPE: typeof EXPIREALL_TYPE;
declare const actionTypes_d_FETCH: typeof FETCH;
declare const actionTypes_d_FETCH_TYPE: typeof FETCH_TYPE;
declare const actionTypes_d_GC: typeof GC;
declare const actionTypes_d_GC_TYPE: typeof GC_TYPE;
declare const actionTypes_d_INVALIDATE: typeof INVALIDATE;
declare const actionTypes_d_INVALIDATEALL: typeof INVALIDATEALL;
declare const actionTypes_d_INVALIDATEALL_TYPE: typeof INVALIDATEALL_TYPE;
declare const actionTypes_d_INVALIDATE_TYPE: typeof INVALIDATE_TYPE;
declare const actionTypes_d_OPTIMISTIC: typeof OPTIMISTIC;
declare const actionTypes_d_OPTIMISTIC_TYPE: typeof OPTIMISTIC_TYPE;
declare const actionTypes_d_RESET: typeof RESET;
declare const actionTypes_d_RESET_TYPE: typeof RESET_TYPE;
declare const actionTypes_d_SET: typeof SET;
declare const actionTypes_d_SET_RESPONSE: typeof SET_RESPONSE;
declare const actionTypes_d_SET_RESPONSE_TYPE: typeof SET_RESPONSE_TYPE;
declare const actionTypes_d_SET_TYPE: typeof SET_TYPE;
declare const actionTypes_d_SUBSCRIBE: typeof SUBSCRIBE;
declare const actionTypes_d_SUBSCRIBE_TYPE: typeof SUBSCRIBE_TYPE;
declare const actionTypes_d_UNSUBSCRIBE: typeof UNSUBSCRIBE;
declare const actionTypes_d_UNSUBSCRIBE_TYPE: typeof UNSUBSCRIBE_TYPE;
declare namespace actionTypes_d {
  export { actionTypes_d_EXPIREALL as EXPIREALL, actionTypes_d_EXPIREALL_TYPE as EXPIREALL_TYPE, actionTypes_d_FETCH as FETCH, actionTypes_d_FETCH_TYPE as FETCH_TYPE, actionTypes_d_GC as GC, actionTypes_d_GC_TYPE as GC_TYPE, actionTypes_d_INVALIDATE as INVALIDATE, actionTypes_d_INVALIDATEALL as INVALIDATEALL, actionTypes_d_INVALIDATEALL_TYPE as INVALIDATEALL_TYPE, actionTypes_d_INVALIDATE_TYPE as INVALIDATE_TYPE, actionTypes_d_OPTIMISTIC as OPTIMISTIC, actionTypes_d_OPTIMISTIC_TYPE as OPTIMISTIC_TYPE, actionTypes_d_RESET as RESET, actionTypes_d_RESET_TYPE as RESET_TYPE, actionTypes_d_SET as SET, actionTypes_d_SET_RESPONSE as SET_RESPONSE, actionTypes_d_SET_RESPONSE_TYPE as SET_RESPONSE_TYPE, actionTypes_d_SET_TYPE as SET_TYPE, actionTypes_d_SUBSCRIBE as SUBSCRIBE, actionTypes_d_SUBSCRIBE_TYPE as SUBSCRIBE_TYPE, actionTypes_d_UNSUBSCRIBE as UNSUBSCRIBE, actionTypes_d_UNSUBSCRIBE_TYPE as UNSUBSCRIBE_TYPE };
}

type EndpointAndUpdate<E extends EndpointInterface> = EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
};
type EndpointDefault = EndpointInterface & {
    update?: EndpointUpdateFunction<EndpointInterface>;
};
/** General meta-data for operators */
interface ActionMeta {
    readonly fetchedAt: number;
    readonly date: number;
    readonly expiresAt: number;
}
/** Action for Controller.set() */
interface SetAction<S extends Queryable = any> {
    type: typeof SET;
    schema: S;
    args: readonly any[];
    meta: ActionMeta;
    value: {} | ((previousValue: Denormalize<S>) => {});
}
interface SetResponseActionBase<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof SET_RESPONSE;
    endpoint: E;
    args: readonly any[];
    key: string;
    meta: ActionMeta;
}
interface SetResponseActionSuccess<E extends EndpointAndUpdate<E> = EndpointDefault> extends SetResponseActionBase<E> {
    response: ResolveType<E>;
    error?: false;
}
interface SetResponseActionError<E extends EndpointAndUpdate<E> = EndpointDefault> extends SetResponseActionBase<E> {
    response: UnknownError;
    error: true;
}
/** Action for Controller.setResponse() */
type SetResponseAction<E extends EndpointAndUpdate<E> = EndpointDefault> = SetResponseActionSuccess<E> | SetResponseActionError<E>;
interface FetchMeta {
    fetchedAt: number;
    resolve: (value?: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void;
    promise: PromiseLike<any>;
}
/** Action for Controller.fetch() */
interface FetchAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof FETCH;
    endpoint: E;
    args: readonly [...Parameters<E>];
    key: string;
    meta: FetchMeta;
}
/** Action for Endpoint.getOptimisticResponse() */
interface OptimisticAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof OPTIMISTIC;
    endpoint: E;
    args: readonly any[];
    key: string;
    meta: ActionMeta;
    error?: false;
}
/** Action for Controller.subscribe() */
interface SubscribeAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof SUBSCRIBE;
    endpoint: E;
    args: readonly any[];
    key: string;
}
/** Action for Controller.unsubscribe() */
interface UnsubscribeAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof UNSUBSCRIBE;
    endpoint: E;
    args: readonly any[];
    key: string;
}
interface ExpireAllAction {
    type: typeof EXPIREALL;
    testKey: (key: string) => boolean;
}
interface InvalidateAllAction {
    type: typeof INVALIDATEALL;
    testKey: (key: string) => boolean;
}
interface InvalidateAction {
    type: typeof INVALIDATE;
    key: string;
}
interface ResetAction {
    type: typeof RESET;
    date: number;
}
interface GCAction {
    type: typeof GC;
    entities: EntityPath[];
    endpoints: string[];
}
/** @see https://dataclient.io/docs/api/Actions */
type ActionTypes = FetchAction | OptimisticAction | SetAction | SetResponseAction | SubscribeAction | UnsubscribeAction | InvalidateAction | InvalidateAllAction | ExpireAllAction | ResetAction | GCAction;

type Dispatch<Actions = ActionTypes> = (value: Actions) => Promise<void>;
interface MiddlewareAPI extends Controller<Dispatch<ActionTypes>> {
}
interface MiddlewareController<Actions = ActionTypes> extends Controller<Dispatch<Actions>> {
}
/** @see https://dataclient.io/docs/api/Manager#middleware */
type Middleware<Actions = ActionTypes> = <C extends MiddlewareController<Actions>>(controller: C) => (next: C['dispatch']) => C['dispatch'];

type PK = string;
/** Normalized state for Reactive Data Client
 *
 * @see https://dataclient.io/docs/concepts/normalization
 */
interface State<T> {
    readonly entities: {
        readonly [entityKey: string]: {
            readonly [pk: string]: T;
        } | undefined;
    };
    readonly endpoints: {
        readonly [key: string]: unknown | PK[] | PK | undefined;
    };
    readonly indexes: NormalizedIndex;
    readonly meta: {
        readonly [key: string]: {
            readonly date: number;
            readonly fetchedAt: number;
            readonly expiresAt: number;
            readonly prevExpiresAt?: number;
            readonly error?: ErrorTypes;
            readonly invalidated?: boolean;
            readonly errorPolicy?: 'hard' | 'soft' | undefined;
        };
    };
    readonly entitiesMeta: {
        readonly [entityKey: string]: {
            readonly [pk: string]: {
                readonly fetchedAt: number;
                readonly date: number;
                readonly expiresAt: number;
            };
        };
    };
    readonly optimistic: (SetResponseAction | OptimisticAction)[];
    readonly lastReset: number;
}
/** Singletons that handle global side-effects
 *
 * Kind of like useEffect() for the central data store
 *
 * @see https://dataclient.io/docs/api/Manager
 */
interface Manager<Actions = ActionTypes> {
    /** @see https://dataclient.io/docs/api/Manager#getmiddleware */
    getMiddleware?(): Middleware<Actions>;
    /** @see https://dataclient.io/docs/api/Manager#middleware */
    middleware?: Middleware<Actions>;
    /** @see https://dataclient.io/docs/api/Manager#cleanup */
    cleanup(): void;
    /** @see https://dataclient.io/docs/api/Manager#init */
    init?: (state: State<any>) => void;
}

declare function applyManager(managers: Manager[], controller: Controller): ReduxMiddleware[];
interface ReduxMiddlewareAPI<R extends Reducer<any, any> = Reducer<any, any>> {
    getState: () => ReducerState<R>;
    dispatch: ReactDispatch<R>;
}
type ReduxMiddleware = <R extends Reducer<any, any>>({ dispatch, }: ReduxMiddlewareAPI<R>) => (next: ReactDispatch<R>) => ReactDispatch<R>;
type ReactDispatch<R extends Reducer<any, any>> = (action: ReducerAction<R>) => Promise<void>;
type Reducer<S, A> = (prevState: S, action: A) => S;
type ReducerState<R extends Reducer<any, any>> = R extends Reducer<infer S, any> ? S : never;
type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<any, infer A> ? A : never;

declare class GCPolicy implements GCInterface {
    protected endpointCount: Map<string, number>;
    protected entityCount: Map<string, Map<string, number>>;
    protected endpointsQ: Set<string>;
    protected entitiesQ: EntityPath[];
    protected intervalId: ReturnType<typeof setInterval>;
    protected controller: Controller;
    protected options: Required<Omit<GCOptions, 'expiresAt'>>;
    constructor({ intervalMS, expiryMultiplier, expiresAt, }?: GCOptions);
    init(controller: Controller): void;
    cleanup(): void;
    createCountRef({ key, paths }: {
        key?: string;
        paths?: EntityPath[];
    }): () => () => void;
    protected expiresAt({ fetchedAt, expiresAt, }: {
        expiresAt: number;
        date: number;
        fetchedAt: number;
    }): number;
    protected runSweep(): void;
    /** Calls the callback when client is not 'busy' with high priority interaction tasks
     *
     * Override for platform-specific implementations
     */
    protected idleCallback(callback: (...args: any[]) => void, options?: IdleRequestOptions): void;
}
declare class ImmortalGCPolicy implements GCInterface {
    init(): void;
    cleanup(): void;
    createCountRef(): () => () => undefined;
}
interface GCOptions {
    intervalMS?: number;
    expiryMultiplier?: number;
    expiresAt?: (meta: {
        expiresAt: number;
        date: number;
        fetchedAt: number;
    }) => number;
}
interface CreateCountRef {
    ({ key, paths }: {
        key?: string;
        paths?: EntityPath[];
    }): () => () => void;
}
interface GCInterface {
    createCountRef: CreateCountRef;
    init(controller: Controller): void;
    cleanup(): void;
}

type GenericDispatch = (value: any) => Promise<void>;
type DataClientDispatch = (value: ActionTypes) => Promise<void>;
interface ControllerConstructorProps<D extends GenericDispatch = DataClientDispatch> {
    dispatch?: D;
    getState?: () => State<unknown>;
    memo?: Pick<MemoCache, 'denormalize' | 'query' | 'buildQueryKey'>;
    gcPolicy?: GCInterface;
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
    protected _dispatch: D;
    /**
     * Gets the latest state snapshot that is fully committed.
     *
     * This can be useful for imperative use-cases like event handlers.
     * This should *not* be used to render; instead useSuspense() or useCache()
     * @see https://dataclient.io/docs/api/Controller#getState
     */
    getState: () => State<unknown>;
    /**
     * Singleton to maintain referential equality between calls
     */
    readonly memo: Pick<MemoCache, 'denormalize' | 'query' | 'buildQueryKey'>;
    /**
     * Handles garbage collection
     */
    readonly gcPolicy: GCInterface;
    constructor({ dispatch, getState, memo, gcPolicy, }?: ControllerConstructorProps<D>);
    set dispatch(dispatch: D);
    get dispatch(): D;
    bindMiddleware({ dispatch, getState, }: {
        dispatch: D;
        getState: ReduxMiddlewareAPI['getState'];
    }): void;
    /*************** Action Dispatchers ***************/
    /**
     * Fetches the endpoint with given args, updating the Reactive Data Client cache with the response or error upon completion.
     * @see https://dataclient.io/docs/api/Controller#fetch
     */
    fetch: <E extends EndpointInterface & {
        update?: EndpointUpdateFunction<E>;
    }>(endpoint: E, ...args: readonly [...Parameters<E>]) => E["schema"] extends undefined | null ? ReturnType<E> : Promise<Denormalize<E["schema"]>>;
    /**
     * Fetches only if endpoint is considered 'stale'; otherwise returns undefined
     * @see https://dataclient.io/docs/api/Controller#fetchIfStale
     */
    fetchIfStale: <E extends EndpointInterface & {
        update?: EndpointUpdateFunction<E>;
    }>(endpoint: E, ...args: readonly [...Parameters<E>]) => E["schema"] extends undefined | null ? ReturnType<E> | ResolveType<E> : Promise<Denormalize<E["schema"]>> | Denormalize<E["schema"]>;
    /**
     * Forces refetching and suspense on useSuspense with the same Endpoint and parameters.
     * @see https://dataclient.io/docs/api/Controller#invalidate
     */
    invalidate: <E extends EndpointInterface>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) => Promise<void>;
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
     * Sets value for the Queryable and args.
     * @see https://dataclient.io/docs/api/Controller#set
     */
    set<S extends Queryable>(schema: S, ...rest: readonly [...SchemaArgs<S>, (previousValue: Denormalize<S>) => {}]): Promise<void>;
    set<S extends Queryable>(schema: S, ...rest: readonly [...SchemaArgs<S>, {}]): Promise<void>;
    /**
     * Sets response for the Endpoint and args.
     * @see https://dataclient.io/docs/api/Controller#setResponse
     */
    setResponse: <E extends EndpointInterface & {
        update?: EndpointUpdateFunction<E>;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, any]) => Promise<void>;
    /**
     * Sets an error response for the Endpoint and args.
     * @see https://dataclient.io/docs/api/Controller#setError
     */
    setError: <E extends EndpointInterface & {
        update?: EndpointUpdateFunction<E>;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, Error]) => Promise<void>;
    /**
     * Resolves an inflight fetch.
     * @see https://dataclient.io/docs/api/Controller#resolve
     */
    resolve: <E extends EndpointInterface & {
        update?: EndpointUpdateFunction<E>;
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
    subscribe: <E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) => Promise<void>;
    /**
     * Marks completion of subscription to a given Endpoint.
     * @see https://dataclient.io/docs/api/Controller#unsubscribe
     */
    unsubscribe: <E extends EndpointInterface<FetchFunction, Schema | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) => Promise<void>;
    /*************** More ***************/
    /**
     * Gets a snapshot (https://dataclient.io/docs/api/Snapshot)
     * @see https://dataclient.io/docs/api/Controller#snapshot
     */
    snapshot: (state: State<unknown>, fetchedAt?: number) => Snapshot<unknown>;
    /**
     * Gets the error, if any, for a given endpoint. Returns undefined for no errors.
     * @see https://dataclient.io/docs/api/Controller#getError
     */
    getError<E extends EndpointInterface>(endpoint: E, ...rest: readonly [null, State<unknown>] | readonly [...Parameters<E>, State<unknown>]): ErrorTypes | undefined;
    getError<E extends Pick<EndpointInterface, 'key'>>(endpoint: E, ...rest: readonly [null, State<unknown>] | readonly [...Parameters<E['key']>, State<unknown>]): ErrorTypes | undefined;
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://dataclient.io/docs/api/Controller#getResponse
     */
    getResponse<E extends EndpointInterface>(endpoint: E, ...rest: readonly [null, State<unknown>] | readonly [...Parameters<E>, State<unknown>]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
        countRef: () => () => void;
    };
    getResponse<E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...rest: readonly [
        ...(readonly [...Parameters<E['key']>] | readonly [null]),
        State<unknown>
    ]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
        countRef: () => () => void;
    };
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://dataclient.io/docs/api/Controller#getResponseMeta
     */
    getResponseMeta<E extends EndpointInterface>(endpoint: E, ...rest: readonly [null, State<unknown>] | readonly [...Parameters<E>, State<unknown>]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
        countRef: () => () => void;
    };
    getResponseMeta<E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...rest: readonly [
        ...(readonly [...Parameters<E['key']>] | readonly [null]),
        State<unknown>
    ]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
        countRef: () => () => void;
    };
    /**
     * Queries the store for a Querable schema
     * @see https://dataclient.io/docs/api/Controller#get
     */
    get<S extends Queryable>(schema: S, ...rest: readonly [
        ...SchemaArgs<S>,
        Pick<State<unknown>, 'entities' | 'indexes'>
    ]): DenormalizeNullable<S> | undefined;
    /**
     * Queries the store for a Querable schema; providing related metadata
     * @see https://dataclient.io/docs/api/Controller#getQueryMeta
     */
    getQueryMeta<S extends Queryable>(schema: S, ...rest: readonly [
        ...SchemaArgs<S>,
        Pick<State<unknown>, 'entities' | 'indexes'>
    ]): {
        data: DenormalizeNullable<S> | undefined;
        countRef: () => () => void;
    };
    private getExpiryStatus;
}

declare class Snapshot<T = unknown> implements SnapshotInterface {
    static readonly abort: AbortOptimistic;
    private state;
    private controller;
    readonly fetchedAt: number;
    readonly abort: AbortOptimistic;
    constructor(controller: Controller, state: State<T>, fetchedAt?: number);
    /*************** Data Access ***************/
    /** @see https://dataclient.io/docs/api/Snapshot#getResponse */
    getResponse<E extends EndpointInterface>(endpoint: E, ...args: readonly [null]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    getResponse<E extends EndpointInterface>(endpoint: E, ...args: readonly [...Parameters<E>]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    getResponse<E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...args: readonly [...Parameters<E['key']>] | readonly [null]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    /** @see https://dataclient.io/docs/api/Snapshot#getResponseMeta */
    getResponseMeta<E extends EndpointInterface>(endpoint: E, ...args: readonly [null]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    getResponseMeta<E extends EndpointInterface>(endpoint: E, ...args: readonly [...Parameters<E>]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    getResponseMeta<E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...args: readonly [...Parameters<E['key']>] | readonly [null]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    /** @see https://dataclient.io/docs/api/Snapshot#getError */
    getError<E extends EndpointInterface>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): ErrorTypes | undefined;
    getError<E extends Pick<EndpointInterface, 'key'>>(endpoint: E, ...args: readonly [...Parameters<E['key']>] | readonly [null]): ErrorTypes | undefined;
    /**
     * Retrieved memoized value for any Querable schema
     * @see https://dataclient.io/docs/api/Snapshot#get
     */
    get<S extends Queryable>(schema: S, ...args: SchemaArgs<S>): DenormalizeNullable<S> | undefined;
    /**
     * Queries the store for a Querable schema; providing related metadata
     * @see https://dataclient.io/docs/api/Snapshot#getQueryMeta
     */
    getQueryMeta<S extends Queryable>(schema: S, ...args: SchemaArgs<S>): {
        data: DenormalizeNullable<S> | undefined;
        countRef: () => () => void;
    };
}

declare function createReducer(controller: Controller): ReducerType;
declare const initialState: State<unknown>;
type ReducerType = (state: State<unknown> | undefined, action: ActionTypes) => State<unknown>;

//# sourceMappingURL=internal.d.ts.map

declare const internal_d_INVALID: typeof INVALID;
type internal_d_MemoCache = MemoCache;
declare const internal_d_MemoCache: typeof MemoCache;
declare const internal_d_initialState: typeof initialState;
declare namespace internal_d {
  export { internal_d_INVALID as INVALID, internal_d_MemoCache as MemoCache, internal_d_initialState as initialState };
}

declare class ResetError extends Error {
    name: string;
    constructor();
}
interface FetchingMeta {
    promise: Promise<any>;
    resolve: (value?: any) => void;
    reject: (value?: any) => void;
    fetchedAt: number;
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
    protected fetching: Map<string, FetchingMeta>;
    readonly dataExpiryLength: number;
    readonly errorExpiryLength: number;
    protected controller: Controller;
    cleanupDate?: number;
    constructor({ dataExpiryLength, errorExpiryLength }?: {
        dataExpiryLength?: number | undefined;
        errorExpiryLength?: number | undefined;
    });
    middleware: Middleware;
    /** On mount */
    init(): void;
    /** Ensures all promises are completed by rejecting remaining. */
    cleanup(): void;
    /** Used by DevtoolsManager to determine whether to log an action */
    skipLogging(action: ActionTypes): boolean;
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
     * Uses throttle endpoints without sideEffects. This is valuable
     * for ensures mutation requests always go through.
     */
    protected handleFetch(action: FetchAction): Promise<any>;
    /** Called when middleware intercepts a set action.
     *
     * Will resolve the promise associated with set key.
     */
    protected handleSet(action: SetResponseAction): void;
    /** Ensures only one request for a given key is in flight at any time
     *
     * Uses key to either retrieve in-flight promise, or if not
     * create a new promise and call fetch.
     *
     * Note: The new promise is not actually tied to fetch at all,
     * but is resolved when the expected 'receive' action is processed.
     * This ensures promises are resolved only once their data is processed
     * by the reducer.
     */
    protected throttle(key: string, fetch: () => Promise<any>, fetchedAt: number): Promise<any>;
    /** Calls the callback when client is not 'busy' with high priority interaction tasks
     *
     * Override for platform-specific implementations
     */
    protected idleCallback(callback: (...args: any[]) => void, options?: IdleRequestOptions): void;
}

declare function initManager(managers: Manager[], controller: Controller, initialState: State<unknown>): () => () => void;

declare function createSubscription<E extends EndpointInterface>(endpoint: E, { args }: {
    args: readonly [...Parameters<E>];
}): SubscribeAction<E>;
declare function createUnsubscription<E extends EndpointInterface>(endpoint: E, { args }: {
    args: readonly [...Parameters<E>];
}): UnsubscribeAction<E>;

declare function createSetResponse<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
}>(endpoint: E, options: {
    args: readonly [...Parameters<E>];
    response: Error;
    fetchedAt?: number;
    error: true;
}): SetResponseAction<E>;
declare function createSetResponse<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
}>(endpoint: E, options: {
    args: readonly [...Parameters<E>];
    response: ResolveType<E>;
    fetchedAt?: number;
    error?: false;
}): SetResponseAction<E>;

declare function createSet<S extends Queryable>(schema: S, { args, fetchedAt, value, }: {
    args: readonly [...SchemaArgs<S>];
    value: {} | ((previousValue: Denormalize<S>) => {});
    fetchedAt?: number;
}): SetAction<S>;

declare function createReset(): ResetAction;

declare function createOptimistic<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
}>(endpoint: E, args: readonly [...Parameters<E>], fetchedAt: number): OptimisticAction<E>;

declare function createMeta(expiryLength: number, fetchedAt?: number): ActionMeta;

declare function createInvalidateAll(testKey: (key: string) => boolean): InvalidateAllAction;

declare function createInvalidate<E extends EndpointInterface>(endpoint: E, { args }: {
    args: readonly [...Parameters<E>];
}): InvalidateAction;

/**
 * Requesting a fetch to begin
 */
declare function createFetch<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
}>(endpoint: E, { args }: {
    args: readonly [...Parameters<E>];
}): FetchAction<E>;

declare function createExpireAll(testKey: (key: string) => boolean): ExpireAllAction;

//# sourceMappingURL=index.d.ts.map

declare const index_d_createExpireAll: typeof createExpireAll;
declare const index_d_createFetch: typeof createFetch;
declare const index_d_createInvalidate: typeof createInvalidate;
declare const index_d_createInvalidateAll: typeof createInvalidateAll;
declare const index_d_createMeta: typeof createMeta;
declare const index_d_createOptimistic: typeof createOptimistic;
declare const index_d_createReset: typeof createReset;
declare const index_d_createSet: typeof createSet;
declare const index_d_createSetResponse: typeof createSetResponse;
declare const index_d_createSubscription: typeof createSubscription;
declare const index_d_createUnsubscription: typeof createUnsubscription;
declare namespace index_d {
  export { index_d_createExpireAll as createExpireAll, index_d_createFetch as createFetch, index_d_createInvalidate as createInvalidate, index_d_createInvalidateAll as createInvalidateAll, index_d_createMeta as createMeta, index_d_createOptimistic as createOptimistic, index_d_createReset as createReset, index_d_createSet as createSet, index_d_createSetResponse as createSetResponse, index_d_createSubscription as createSubscription, index_d_createUnsubscription as createUnsubscription };
}

/** Listens to online/offline events for triggering re-fetches on reconnect.
 *
 * Implement this interface to provide custom connectivity detection
 * (e.g., for React Native or Node.js environments).
 *
 * @see https://dataclient.io/docs/api/PollingSubscription
 */
interface ConnectionListener {
    /** Returns whether the client is currently connected to the network. */
    isOnline: () => boolean;
    /** Register a handler to be called when the client comes back online. */
    addOnlineListener: (handler: () => void) => void;
    /** Remove a previously registered online handler. */
    removeOnlineListener: (handler: () => void) => void;
    /** Register a handler to be called when the client goes offline. */
    addOfflineListener: (handler: () => void) => void;
    /** Remove a previously registered offline handler. */
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
declare class SubscriptionManager<S extends SubscriptionConstructable = SubscriptionConstructable> implements Manager<Actions> {
    protected subscriptions: {
        [key: string]: InstanceType<S>;
    };
    protected readonly Subscription: S;
    protected controller: Controller;
    constructor(Subscription: S);
    middleware: Middleware;
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

type Action = ActionTypes;
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
    stateSanitizer?: <S extends State<unknown>>(state: S, index: number) => S;
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
    predicate?: <S extends State<unknown>, A extends Action>(state: S, action: A) => boolean;
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

/** Integrates with https://github.com/reduxjs/redux-devtools
 *
 * Options: https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md
 *
 * @see https://dataclient.io/docs/api/DevToolsManager
 */
declare class DevToolsManager implements Manager {
    middleware: Middleware;
    protected devTools: undefined | any;
    protected started: boolean;
    protected actions: [ActionTypes, State<unknown>][];
    protected controller: Controller;
    skipLogging?: (action: ActionTypes) => boolean;
    maxBufferLength: number;
    constructor(config?: DevToolsConfig, skipLogging?: (action: ActionTypes) => boolean);
    handleAction(action: any, state: any): void;
    /** Called when initial state is ready */
    init(state: State<any>): void;
    /** Ensures all subscriptions are cleaned up. */
    cleanup(): void;
}

/** Handling network unauthorized indicators like HTTP 401
 *
 * @see https://dataclient.io/docs/api/LogoutManager
 */
declare class LogoutManager implements Manager {
    constructor({ handleLogout, shouldLogout }?: Props);
    middleware: Middleware;
    cleanup(): void;
    protected shouldLogout(error: UnknownError): boolean;
    handleLogout(controller: Controller): void;
}
type HandleLogout = (controller: Controller) => void;
interface Props {
    handleLogout?: HandleLogout;
    shouldLogout?: (error: UnknownError) => boolean;
}

export { type AbstractInstanceType, type ActionMeta, type ActionTypes, type ConnectionListener, Controller, type CreateCountRef, type DataClientDispatch, DefaultConnectionListener, type Denormalize, type DenormalizeNullable, type DevToolsConfig, DevToolsManager, type Dispatch, type EndpointExtraOptions, type EndpointInterface, type EndpointUpdateFunction, type EntityInterface, type ErrorTypes, type ExpireAllAction, ExpiryStatus, type FetchAction, type FetchFunction, type FetchMeta, type FetchingMeta, type GCAction, type GCInterface, type GCOptions, GCPolicy, type GenericDispatch, type INormalizeDelegate, type IQueryDelegate, ImmortalGCPolicy, type InvalidateAction, type InvalidateAllAction, LogoutManager, type Manager, type Mergeable, type Middleware, type MiddlewareAPI, type NI, type NetworkError, NetworkManager, type Normalize, type NormalizeNullable, type OptimisticAction, type PK, PollingSubscription, type Queryable, type ResetAction, ResetError, type ResolveType, type ResultEntry, type Schema, type SchemaArgs, type SchemaClass, type SetAction, type SetResponseAction, type SetResponseActionBase, type SetResponseActionError, type SetResponseActionSuccess, type State, type SubscribeAction, SubscriptionManager, type UnknownError, type UnsubscribeAction, type UpdateFunction, internal_d as __INTERNAL__, actionTypes_d as actionTypes, index_d as actions, applyManager, createReducer, initManager, initialState };
