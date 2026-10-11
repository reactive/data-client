type Schema$1 = null | string | {
    [K: string]: any;
} | Schema$1[] | SchemaSimple$1 | Serializable$1;
interface Queryable$1<Args extends readonly any[] = readonly any[]> {
    queryKey(args: Args, unvisit: (...args: any) => any, delegate: {
        getEntity: any;
        getIndex: any;
    }): {};
}
type Serializable$1<T extends {
    toJSON(): string;
} = {
    toJSON(): string;
}> = (value: any) => T;
interface SchemaSimple$1<T = any, Args extends readonly any[] = any[]> {
    normalize(input: any, parent: any, key: any, delegate: INormalizeDelegate$1, 
    /** The nearest enclosing entity-like schema (one with `pk`), if any.
     * Tracked automatically by the visit walker. */
    parentEntity?: any): any;
    denormalize(input: {}, delegate: IDenormalizeDelegate$1): T;
    queryKey(args: Args, unvisit: (...args: any) => any, delegate: {
        getEntity: any;
        getIndex: any;
    }): any;
}
interface EntityInterface<T = any> extends SchemaSimple$1 {
    createIfValid(props: any): any;
    pk(params: any, parent: any, key: string | undefined, args: readonly any[]): string | number | undefined;
    readonly key: string;
    indexes?: any;
    schema: Record<string, Schema$1>;
    prototype: T;
    cacheWith?: object;
    maxEntityDepth?: number;
}
interface Mergeable$1 {
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
/** Visits next data + schema while recurisvely normalizing */
interface Visit$1 {
    (schema: any, value: any, parent: any, key: any): any;
    creating?: boolean;
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
interface EntitiesInterface$1 {
    keys(): IterableIterator<string>;
    entries(): IterableIterator<[string, any]>;
}
/** Get normalized Entity from store */
interface GetEntity$1 {
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
    getEntities(key: string): EntitiesInterface$1 | undefined;
    /** Gets any previously normalized entity from store */
    getEntity: GetEntity$1;
    /** Get PK using an Entity Index */
    getIndex: GetIndex;
    /** Return to consider results invalid */
    INVALID: symbol;
}
/** Helpers during schema.denormalize() */
interface IDenormalizeDelegate$1 {
    /** Recursive denormalize of nested schemas */
    unvisit(schema: any, input: any): any;
    /** Raw endpoint args. Reading this does NOT contribute to cache
     * invalidation — if your output varies with args, register an `argsKey`
     * so the cache buckets correctly. */
    readonly args: readonly any[];
    /** Adds a memoization dimension to the surrounding cache frame.
     * `fn` must be referentially stable (it doubles as the cache path key).
     * Returns `fn(args)` for convenience. */
    argsKey(fn: (args: readonly any[]) => string | undefined): string | undefined;
}
/** Helpers during schema.normalize() */
interface INormalizeDelegate$1 {
    /** Recursive normalize of nested schemas */
    visit: Visit$1;
    /** Raw endpoint args for this normalize call */
    readonly args: readonly any[];
    /** Action meta-data for this normalize call */
    readonly meta: {
        fetchedAt: number;
        date: number;
        expiresAt: number;
    };
    /** Get all entities for a given schema key */
    getEntities(key: string): EntitiesInterface$1 | undefined;
    /** Gets any previously normalized entity from store */
    getEntity: GetEntity$1;
    /** Updates an entity using merge lifecycles when it has previously been set */
    mergeEntity(schema: Mergeable$1 & {
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
type EntityFields$1<U> = {
    readonly [K in keyof U as U[K] extends (...args: any) => any ? never : K]?: U[K] extends number ? U[K] | string : U[K] extends string ? U[K] | number : U[K];
};

type SchemaArgs$1<S extends Schema$1> = S extends {
    createIfValid: any;
    pk: any;
    key: string;
    prototype: infer U;
} ? [
    EntityFields$1<U>
] : S extends ({
    queryKey(args: infer Args, ...rest: any): any;
}) ? Args : S extends {
    [K: string]: any;
} ? ObjectArgs$1<S> : never;
type ObjectArgs$1<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema$1 ? SchemaArgs$1<S[K]> : never;
}[keyof S];

type AbstractInstanceType$1<T> = T extends new (...args: any) => infer U ? U : T extends {
    prototype: infer U;
} ? U : never;
type DenormalizeObject$1<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema$1 ? Denormalize$1<S[K]> : S[K];
};
type DenormalizeNullableObject$1<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema$1 ? DenormalizeNullable$1<S[K]> : S[K];
};
type NormalizeObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema$1 ? Normalize<S[K]> : S[K];
};
type NormalizedNullableObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema$1 ? NormalizeNullable<S[K]> : S[K];
};
interface NestedSchemaClass$1<T = any> {
    schema: Record<string, Schema$1>;
    prototype: T;
}
interface RecordClass$1<T = any> extends NestedSchemaClass$1<T> {
    fromJS: (...args: any) => AbstractInstanceType$1<T>;
}
type DenormalizeNullableNestedSchema$1<S extends NestedSchemaClass$1> = keyof S['schema'] extends never ? S['prototype'] : string extends keyof S['schema'] ? S['prototype'] : S['prototype'];
type NormalizeReturnType<T> = T extends (...args: any) => infer R ? R : never;
type Denormalize$1<S> = S extends {
    createIfValid: any;
    pk: any;
    key: string;
    prototype: infer U;
} ? U : S extends RecordClass$1 ? AbstractInstanceType$1<S> : S extends {
    denormalize: (...args: any) => any;
} ? ReturnType<S['denormalize']> : S extends Serializable$1<infer T> ? T : S extends Array<infer F> ? Denormalize$1<F>[] : S extends {
    [K: string]: any;
} ? DenormalizeObject$1<S> : S;
type DenormalizeNullable$1<S> = S extends ({
    createIfValid: any;
    pk: any;
    key: string;
    prototype: any;
    schema: any;
}) ? DenormalizeNullableNestedSchema$1<S> | undefined : S extends RecordClass$1 ? DenormalizeNullableNestedSchema$1<S> : S extends {
    _denormalizeNullable: (...args: any) => any;
} ? ReturnType<S['_denormalizeNullable']> : S extends Serializable$1<infer T> ? T : S extends Array<infer F> ? Denormalize$1<F>[] | undefined : S extends {
    [K: string]: any;
} ? DenormalizeNullableObject$1<S> : S;
type Normalize<S> = S extends {
    createIfValid: any;
    pk: any;
    key: string;
    prototype: {};
} ? string : S extends RecordClass$1 ? NormalizeObject<S['schema']> : S extends {
    normalize: (...args: any) => any;
} ? NormalizeReturnType<S['normalize']> : S extends Serializable$1<infer T> ? T : S extends Array<infer F> ? Normalize<F>[] : S extends {
    [K: string]: any;
} ? NormalizeObject<S> : S;
type NormalizeNullable<S> = S extends {
    createIfValid: any;
    pk: any;
    key: string;
    prototype: {};
} ? string | undefined : S extends RecordClass$1 ? NormalizedNullableObject<S['schema']> : S extends {
    _normalizeNullable: (...args: any) => any;
} ? NormalizeReturnType<S['_normalizeNullable']> : S extends Serializable$1<infer T> ? T : S extends Array<infer F> ? Normalize<F>[] | undefined : S extends {
    [K: string]: any;
} ? NormalizedNullableObject<S> : S;

declare const INVALID: unique symbol;

/** Function path used by `argsKey` deps. Distinguished from object paths
 * via `typeof === 'function'`. */
type KeyFn = (args: readonly any[]) => string | undefined;
/** Maps a (ordered) list of dependencies to a value.
 *
 * Useful as a memoization cache for flat/normalized stores.
 *
 * Object dependencies are weakly referenced (via `WeakMap`), allowing
 * automatic garbage collection when the dependency is no longer used.
 * String-keyed dependencies (used by `argsKey`) sit on a `Map` keyed by the
 * value returned from `path(args)`, branching on a stable function reference.
 */
declare class WeakDependencyMap<Path, K extends object = object, V = any> {
    private readonly next;
    private nextPath;
    /** Sticky: true once any function-typed (`argsKey`) dep has been stored.
     * Lets `get` pick the entity-only fast path when no schema in this map
     * uses `argsKey` — avoids a polymorphic `typeof` branch per walk step. */
    private hasStr;
    get(entity: K, getDependency: GetDependency<Path, K | symbol>, args?: readonly any[]): readonly [undefined, undefined] | readonly [V, Path[]];
    /** Slow path: dep chain may interleave entity and `argsKey`-style deps. */
    private _getMixed;
    set(dependencies: Dep<Path, K>[], value: V, args?: readonly any[], 
    /** Optional consumer-facing journey returned to `get()` callers verbatim.
     * Defaults to `dependencies.map(d => d.path)`. Pass an explicit array to
     * skip the per-write `.map(...)` and (more importantly) to skip per-hit
     * post-processing — see `GlobalCache.getResults` for the read-side
     * payoff. The array becomes a shared reference held by every subsequent
     * cache hit; callers MUST NOT mutate it. */
    journey?: Path[]): void;
    /** True once any `argsKey`-style dep has been written. Consumers can use
     * this to skip function-stripping work on the hit path when false. */
    get hasStringDeps(): boolean;
}
type GetDependency<Path, K = object | symbol> = (lookup: Path) => K | undefined;
interface Dep<Path, K = object> {
    path: Path | KeyFn;
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
    abstract getEntities(key: string): EntitiesInterface$1 | undefined;
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
    denormalize<S extends Schema$1>(schema: S | undefined, input: unknown, entities: any, args?: readonly any[]): {
        data: DenormalizeNullable$1<S> | typeof INVALID;
        paths: EntityPath[];
    };
    /** Compute denormalized form maintaining referential equality for same inputs */
    query<S extends Schema$1>(schema: S, args: readonly any[], state: StateInterface, argsKey?: string): {
        data: DenormalizeNullable$1<S> | typeof INVALID;
        paths: EntityPath[];
    };
    buildQueryKey<S extends Schema$1>(schema: S, args: readonly any[], state: StateInterface, argsKey?: string): NormalizeNullable<S>;
}
type StateInterface = {
    entities: Record<string, Record<string, any> | undefined> | {
        getIn(k: string[]): any;
    };
    indexes: NormalizedIndex | {
        getIn(k: string[]): any;
    };
};

interface NetworkError$1 extends Error {
    status: number;
    response?: Response;
}
interface UnknownError$1 extends Error {
    status?: unknown;
    response?: unknown;
}
type ErrorTypes$1 = NetworkError$1 | UnknownError$1;

/** What the function's promise resolves to */
type ResolveType$1<E extends (...args: any) => any> = ReturnType<E> extends Promise<infer R> ? R : never;

declare const enum ExpiryStatus {
    Invalid = 1,
    InvalidIfStale = 2,
    Valid = 3
}
type ExpiryStatusInterface$1 = 1 | 2 | 3;

interface SnapshotInterface$1 {
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://dataclient.io/docs/api/Snapshot#getResponse
     */
    getResponse<E extends Pick<EndpointInterface$1, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...args: readonly any[]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatusInterface$1;
        expiresAt: number;
    };
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://dataclient.io/docs/api/Snapshot#getResponseMeta
     */
    getResponseMeta<E extends Pick<EndpointInterface$1, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...args: readonly any[]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatusInterface$1;
        expiresAt: number;
    };
    /** @see https://dataclient.io/docs/api/Snapshot#getError */
    getError: <E extends Pick<EndpointInterface$1, 'key'>, Args extends readonly [...Parameters<E['key']>]>(endpoint: E, ...args: Args) => ErrorTypes$1 | undefined;
    /**
     * Retrieved memoized value for any Querable schema
     * @see https://dataclient.io/docs/api/Snapshot#get
     */
    get<S extends Queryable$1>(schema: S, ...args: readonly any[]): any;
    /**
     * Queries the store for a Querable schema; providing related metadata
     * @see https://dataclient.io/docs/api/Snapshot#getQueryMeta
     */
    getQueryMeta<S extends Queryable$1>(schema: S, ...args: readonly any[]): {
        data: any;
        countRef: () => () => void;
    };
    readonly fetchedAt: number;
    readonly abort: Error;
}

/** Defines a networking endpoint */
interface EndpointInterface$1<F extends FetchFunction$1 = FetchFunction$1, S extends Schema$1 | undefined = Schema$1 | undefined, M extends boolean | undefined = boolean | undefined> extends EndpointExtraOptions$1<F> {
    (...args: Parameters<F>): ReturnType<F>;
    key(...args: Parameters<F>): string;
    readonly sideEffect?: M;
    readonly schema?: S;
}
interface EndpointExtraOptions$1<F extends FetchFunction$1 = FetchFunction$1> {
    /** Default data expiry length, will fall back to NetworkManager default if not defined */
    readonly dataExpiryLength?: number;
    /** Default error expiry length, will fall back to NetworkManager default if not defined */
    readonly errorExpiryLength?: number;
    /** Poll with at least this frequency in miliseconds */
    readonly pollFrequency?: number;
    /** Marks cached resources as invalid if they are stale */
    readonly invalidIfStale?: boolean;
    /** Enables optimistic updates for this request - uses return value as assumed network response */
    getOptimisticResponse?(snap: SnapshotInterface$1, ...args: Parameters<F>): ResolveType$1<F>;
    /** Determines whether to throw or fallback to */
    errorPolicy?(error: any): 'hard' | 'soft' | undefined;
    /** User-land extra data to send */
    readonly extra?: any;
}

type FetchFunction$1<A extends readonly any[] = any, R = any> = (...args: A) => Promise<R>;

declare class AbortOptimistic extends Error {
}

/** Value types for `Controller.set()`, including batch `set([Entity], rows)` */

/** What one row normalizes to: a reference to one stored entity */
type EntityRef = string | {
    readonly id: string;
    readonly schema: string;
};
/** Schemas that write each row to one stored entity: Entity, Union, or Invalidate (batch delete).
 * Query, All and Collection don't: they normalize to lists, or Collection keys by args batch set() lacks. */
type SetEntitySchema = EntityInterface | EntityRefSchema;
/** Union or Invalidate */
type EntityRefSchema = {
    _normalizeNullable(): EntityRef | undefined;
    pk?: never;
};
/** `[Entity]`, `schema.Array(Entity)` or `schema.Values(Entity)` (or of a Union or Invalidate) */
type SetManySchema = readonly SetEntitySchema[] | {
    readonly schema: SetEntitySchema | Record<string, EntityInterface>;
    schemaKey(): string;
    queryKey(...args: any): undefined;
    pk?: never;
};
/** `new Invalidate(Entity)` (or of a Union): not Queryable, since its queryKey() returns undefined */
type SetInvalidateSchema = EntityRefSchema & {
    queryKey(...args: any): undefined;
    query?: never;
};
type IsUnion<T, U = T> = T extends unknown ? [
    U
] extends [T] ? false : true : never;
type FunctionKeys<U> = {
    [K in keyof U]: U[K] extends (...args: any) => any ? K : never;
}[keyof U];
/** Raw input for one field: numbers and strings coerce (literals stay exact);
 * objects are pre-normalize */
type SetField<T> = T extends number ? number extends T ? T | string : T : T extends string ? string extends T ? T | number : T : T extends object ? unknown : T;
/** Fields of one row (or a coerced primitive); like EntityFields, but distributive
 * and without key remapping (TS 4.0). A Union gets one row per member, so a
 * discriminator like `type` selects the member the other fields are checked against. */
type SetRow<U> = 0 extends 1 & U ? {
    readonly [k: string]: any;
} : U extends object ? {
    readonly [K in Exclude<keyof U, FunctionKeys<U>>]?: SetField<U[K]>;
} : SetField<U>;
/** Keeps S inferred from the schema alone: inferring it from the value too would
 * walk the value's type against every conditional in SetValue (TS 5.4 has NoInfer) */
type SkipInfer<T, S> = [T][S extends unknown ? 0 : never];
type SetManyValue<S> = S extends readonly (infer E)[] ? true extends IsUnion<E> ? readonly {
    'Use a Union schema for several Entity types': never;
}[] : readonly SetRow<Denormalize$1<E>>[] : SetValue<S>;
/** Raw input `set()` normalizes for a Queryable */
type SetValue<S> = InputSchema<InputSchema<InputSchema<S>>> extends infer N ? N extends EntityInterface ? SetRow<Denormalize$1<N>> : SetInput<Denormalize$1<N>> : never;
/** Query normalizes with its inner schema; its process() output is not input
 *
 * Applied three times in SetValue to unwrap nested Queries (TS 4.0 has no recursive aliases)
 */
type InputSchema<S> = S extends ({
    readonly schema: infer Sch;
    process(...args: any): any;
    pk?: never;
}) ? Sch : S;
/** Raw input for a denormalized value, like a Collection's list or a Union's row */
type SetInput<T> = 0 extends 1 & T ? any : [
    T
] extends [readonly (infer U)[]] ? readonly SetRow<U>[] : string extends keyof T ? {
    readonly [k: string]: SetRow<T[keyof T]>;
} : SetRow<T>;

type ResultEntry<E extends EndpointInterface$1> = E['schema'] extends undefined | null ? ResolveType$1<E> : Normalize<E['schema']>;
type EndpointUpdateFunction<Source extends EndpointInterface$1, Updaters extends Record<string, any> = Record<string, any>> = (source: ResultEntry<Source>, ...args: any) => {
    [K in keyof Updaters]: (result: Updaters[K]) => Updaters[K];
};

declare const FETCH: 'rdc/fetch';
declare const SET: 'rdc/set';
declare const SET_RESPONSE: 'rdc/setresponse';
declare const OPTIMISTIC: 'rdc/optimistic';
declare const RESET: 'rdc/reset';
declare const SUBSCRIBE: 'rdc/subscribe';
declare const UNSUBSCRIBE: 'rdc/unsubscribe';
declare const INVALIDATE: 'rdc/invalidate';
declare const INVALIDATEALL: 'rdc/invalidateall';
declare const EXPIREALL: 'rdc/expireall';
declare const GC: 'rdc/gc';

type EndpointAndUpdate<E extends EndpointInterface$1> = EndpointInterface$1 & {
    update?: EndpointUpdateFunction<E>;
};
type EndpointDefault = EndpointInterface$1 & {
    update?: EndpointUpdateFunction<EndpointInterface$1>;
};
/** General meta-data for operators */
interface ActionMeta {
    readonly fetchedAt: number;
    readonly date: number;
    readonly expiresAt: number;
}
/** Action for Controller.set() */
interface SetAction<S extends Queryable$1 = any> {
    type: typeof SET;
    schema: S;
    args: readonly any[];
    meta: ActionMeta;
    value: {} | ((previousValue: Denormalize$1<S>) => {});
}
interface SetResponseActionBase<E extends EndpointAndUpdate<E> = EndpointDefault> {
    type: typeof SET_RESPONSE;
    endpoint: E;
    args: readonly any[];
    key: string;
    meta: ActionMeta;
}
interface SetResponseActionSuccess<E extends EndpointAndUpdate<E> = EndpointDefault> extends SetResponseActionBase<E> {
    response: ResolveType$1<E>;
    error?: false;
}
interface SetResponseActionError<E extends EndpointAndUpdate<E> = EndpointDefault> extends SetResponseActionBase<E> {
    response: UnknownError$1;
    error: true;
}
/** Action for Controller.setResponse() */
type SetResponseAction<E extends EndpointAndUpdate<E> = EndpointDefault> = SetResponseActionSuccess<E> | SetResponseActionError<E>;
interface FetchMeta {
    fetchedAt: number;
    resolve: (value?: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void;
    promise: Promise<any>;
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
            readonly error?: ErrorTypes$1;
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

interface ReduxMiddlewareAPI<R extends Reducer<any, any> = Reducer<any, any>> {
    getState: () => ReducerState<R>;
    dispatch: ReactDispatch<R>;
}
type ReactDispatch<R extends Reducer<any, any>> = (action: ReducerAction<R>) => Promise<void>;
type Reducer<S, A> = (prevState: S, action: A) => S;
type ReducerState<R extends Reducer<any, any>> = R extends Reducer<infer S, any> ? S : never;
type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<any, infer A> ? A : never;

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
    /** Internal: set by a provider that will call initManager() for this controller, until it does */
    awaitingInit?: boolean;
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
    fetch: <E extends EndpointInterface$1 & {
        update?: EndpointUpdateFunction<E>;
    }>(endpoint: E, ...args: readonly [...Parameters<E>]) => E['schema'] extends undefined | null ? ReturnType<E> : Promise<Denormalize$1<E['schema']>>;
    /**
     * Fetches only if endpoint is considered 'stale'; otherwise returns undefined
     * @see https://dataclient.io/docs/api/Controller#fetchIfStale
     */
    fetchIfStale: <E extends EndpointInterface$1 & {
        update?: EndpointUpdateFunction<E>;
    }>(endpoint: E, ...args: readonly [...Parameters<E>]) => E['schema'] extends undefined | null ? ReturnType<E> | ResolveType$1<E> : Promise<Denormalize$1<E['schema']>> | Denormalize$1<E['schema']>;
    /**
     * Forces refetching and suspense on useSuspense with the same Endpoint and parameters.
     * @see https://dataclient.io/docs/api/Controller#invalidate
     */
    invalidate: <E extends EndpointInterface$1>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) => Promise<void>;
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
    set<S extends Queryable$1>(schema: S, ...rest: readonly [
        ...SchemaArgs$1<S>,
        SkipInfer<SetValue<S> | ((previousValue: Denormalize$1<S>) => SetValue<S>), S>
    ]): Promise<void>;
    /**
     * Sets every row of an Array or Values of one Entity (or Union) in one normalize,
     * or invalidates the one Entity an Invalidate schema's value identifies.
     * @see https://dataclient.io/docs/api/Controller#set-array
     */
    set<S extends SetManySchema | SetInvalidateSchema>(schema: S, value: SkipInfer<SetManyValue<S>, S>): Promise<void>;
    /**
     * Sets response for the Endpoint and args.
     * @see https://dataclient.io/docs/api/Controller#setResponse
     */
    setResponse: <E extends EndpointInterface$1 & {
        update?: EndpointUpdateFunction<E>;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, any]) => Promise<void>;
    /**
     * Sets an error response for the Endpoint and args.
     * @see https://dataclient.io/docs/api/Controller#setError
     */
    setError: <E extends EndpointInterface$1 & {
        update?: EndpointUpdateFunction<E>;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, Error]) => Promise<void>;
    /**
     * Resolves an inflight fetch.
     * @see https://dataclient.io/docs/api/Controller#resolve
     */
    resolve: <E extends EndpointInterface$1 & {
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
    subscribe: <E extends EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) => Promise<void>;
    /**
     * Marks completion of subscription to a given Endpoint.
     * @see https://dataclient.io/docs/api/Controller#unsubscribe
     */
    unsubscribe: <E extends EndpointInterface$1<FetchFunction$1, Schema$1 | undefined, undefined | false>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) => Promise<void>;
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
    getError<E extends EndpointInterface$1>(endpoint: E, ...rest: readonly [null, State<unknown>] | readonly [...Parameters<E>, State<unknown>]): ErrorTypes$1 | undefined;
    getError<E extends Pick<EndpointInterface$1, 'key'>>(endpoint: E, ...rest: readonly [null, State<unknown>] | readonly [...Parameters<E['key']>, State<unknown>]): ErrorTypes$1 | undefined;
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://dataclient.io/docs/api/Controller#getResponse
     */
    getResponse<E extends EndpointInterface$1>(endpoint: E, ...rest: readonly [null, State<unknown>] | readonly [...Parameters<E>, State<unknown>]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
        countRef: () => () => void;
    };
    getResponse<E extends Pick<EndpointInterface$1, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...rest: readonly [
        ...(readonly [...Parameters<E['key']>] | readonly [null]),
        State<unknown>
    ]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
        countRef: () => () => void;
    };
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://dataclient.io/docs/api/Controller#getResponseMeta
     */
    getResponseMeta<E extends EndpointInterface$1>(endpoint: E, ...rest: readonly [null, State<unknown>] | readonly [...Parameters<E>, State<unknown>]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
        countRef: () => () => void;
    };
    getResponseMeta<E extends Pick<EndpointInterface$1, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...rest: readonly [
        ...(readonly [...Parameters<E['key']>] | readonly [null]),
        State<unknown>
    ]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
        countRef: () => () => void;
    };
    /**
     * Queries the store for a Querable schema
     * @see https://dataclient.io/docs/api/Controller#get
     */
    get<S extends Queryable$1>(schema: S, ...rest: readonly [
        ...SchemaArgs$1<S>,
        Pick<State<unknown>, 'entities' | 'indexes'>
    ]): DenormalizeNullable$1<S> | undefined;
    /**
     * Queries the store for a Querable schema; providing related metadata
     * @see https://dataclient.io/docs/api/Controller#getQueryMeta
     */
    getQueryMeta<S extends Queryable$1>(schema: S, ...rest: readonly [
        ...SchemaArgs$1<S>,
        Pick<State<unknown>, 'entities' | 'indexes'>
    ]): {
        data: DenormalizeNullable$1<S> | undefined;
        countRef: () => () => void;
    };
    private getExpiryStatus;
}

declare class Snapshot<T = unknown> implements SnapshotInterface$1 {
    static readonly abort: AbortOptimistic;
    private state;
    private controller;
    readonly fetchedAt: number;
    readonly abort: AbortOptimistic;
    constructor(controller: Controller, state: State<T>, fetchedAt?: number);
    /*************** Data Access ***************/
    /** @see https://dataclient.io/docs/api/Snapshot#getResponse */
    getResponse<E extends EndpointInterface$1>(endpoint: E, ...args: readonly [null]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    getResponse<E extends EndpointInterface$1>(endpoint: E, ...args: readonly [...Parameters<E>]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    getResponse<E extends Pick<EndpointInterface$1, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...args: readonly [...Parameters<E['key']>] | readonly [null]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    /** @see https://dataclient.io/docs/api/Snapshot#getResponseMeta */
    getResponseMeta<E extends EndpointInterface$1>(endpoint: E, ...args: readonly [null]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    getResponseMeta<E extends EndpointInterface$1>(endpoint: E, ...args: readonly [...Parameters<E>]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    getResponseMeta<E extends Pick<EndpointInterface$1, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...args: readonly [...Parameters<E['key']>] | readonly [null]): {
        data: DenormalizeNullable$1<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    /** @see https://dataclient.io/docs/api/Snapshot#getError */
    getError<E extends EndpointInterface$1>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): ErrorTypes$1 | undefined;
    getError<E extends Pick<EndpointInterface$1, 'key'>>(endpoint: E, ...args: readonly [...Parameters<E['key']>] | readonly [null]): ErrorTypes$1 | undefined;
    /**
     * Retrieved memoized value for any Querable schema
     * @see https://dataclient.io/docs/api/Snapshot#get
     */
    get<S extends Queryable$1>(schema: S, ...args: SchemaArgs$1<S>): DenormalizeNullable$1<S> | undefined;
    /**
     * Queries the store for a Querable schema; providing related metadata
     * @see https://dataclient.io/docs/api/Snapshot#getQueryMeta
     */
    getQueryMeta<S extends Queryable$1>(schema: S, ...args: SchemaArgs$1<S>): {
        data: DenormalizeNullable$1<S> | undefined;
        countRef: () => () => void;
    };
}

interface NetworkError extends Error {
    status: number;
    response?: Response;
}
interface UnknownError extends Error {
    status?: unknown;
    response?: unknown;
}
type ErrorTypes = NetworkError | UnknownError;

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
interface NestedSchemaClass<T = any> {
    schema: Record<string, Schema>;
    prototype: T;
}
interface RecordClass<T = any> extends NestedSchemaClass<T> {
    fromJS: (...args: any) => AbstractInstanceType<T>;
}
type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> = keyof S['schema'] extends never ? S['prototype'] : string extends keyof S['schema'] ? S['prototype'] : S['prototype'] & {
    [K in keyof S['schema']]: DenormalizeNullable<S['schema'][K]>;
};
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

interface SnapshotInterface {
    readonly fetchedAt: number;
    readonly abort: Error;
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://dataclient.io/docs/api/Snapshot#getResponse
     */
    getResponse<E extends EndpointInterface>(endpoint: E, ...args: readonly [null]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatusInterface;
        expiresAt: number;
    };
    getResponse<E extends EndpointInterface>(endpoint: E, ...args: readonly [...Parameters<E>]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatusInterface;
        expiresAt: number;
    };
    getResponse<E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...args: readonly [...Parameters<E['key']>] | readonly [null]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatusInterface;
        expiresAt: number;
    };
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://dataclient.io/docs/api/Snapshot#getResponseMeta
     */
    getResponseMeta<E extends EndpointInterface>(endpoint: E, ...args: readonly [null]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatusInterface;
        expiresAt: number;
    };
    getResponseMeta<E extends EndpointInterface>(endpoint: E, ...args: readonly [...Parameters<E>]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatusInterface;
        expiresAt: number;
    };
    getResponseMeta<E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>>(endpoint: E, ...args: readonly [...Parameters<E['key']>] | readonly [null]): {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatusInterface;
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
}
type ExpiryStatusInterface = 1 | 2 | 3;

/** What the function's promise resolves to */
type ResolveType<E extends (...args: any) => any> = ReturnType<E> extends Promise<infer R> ? R : never;

type FetchFunction<A extends readonly any[] = any, R = any> = (...args: A) => Promise<R>;
interface EndpointExtraOptions<F extends FetchFunction = FetchFunction> {
    /** Default data expiry length, will fall back to NetworkManager default if not defined */
    readonly dataExpiryLength?: number;
    /** Default error expiry length, will fall back to NetworkManager default if not defined */
    readonly errorExpiryLength?: number;
    /** Poll with at least this frequency in miliseconds */
    readonly pollFrequency?: number;
    /** Marks cached resources as invalid if they are stale */
    readonly invalidIfStale?: boolean;
    /** Determines whether to throw or fallback to */
    errorPolicy?(error: any): 'hard' | 'soft' | undefined;
    /** Enables optimistic updates for this request - uses return value as assumed network response */
    getOptimisticResponse?(snap: SnapshotInterface, ...args: Parameters<F>): ResolveType<F>;
    /** User-land extra data to send */
    readonly extra?: any;
}

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
interface SchemaSimple<T = any, Args extends readonly any[] = any> {
    /**
     * Normalize a value into entity table form.
     *
     * @param input        The value being normalized.
     * @param parent       The parent object/array/dictionary containing `input`.
     * @param key          The key under which `input` lives on `parent`.
     * @param delegate     Recursive visitor, endpoint args, and store accessors.
     * @param parentEntity Nearest enclosing entity-like schema (one with `pk`),
     *                     tracked automatically by the visit walker. `Scalar`
     *                     uses this to discover its entity binding.
     */
    normalize(input: any, parent: any, key: any, delegate: INormalizeDelegate, parentEntity?: any): any;
    denormalize(input: {}, delegate: IDenormalizeDelegate): T;
    queryKey(args: Args, unvisit: (...args: any) => any, delegate: {
        getEntity: any;
        getIndex: any;
    }): any;
}
interface Mergeable {
    key: string;
    merge(existing: any, incoming: any): any;
    mergeWithStore(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
    mergeMetaWithStore(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
}
/**
 * Visits next data + schema while recursively normalizing.
 *
 * @param schema The schema to apply to `value`.
 * @param value  The value being visited.
 * @param parent The parent object/array/dictionary that holds `value`.
 *               Schemas that recurse via `visit` should pass their own
 *               `input` (or the surrounding container) here.
 * @param key    The key under which `value` lives on `parent`.
 *
 * The walker internally tracks the nearest enclosing entity-like schema and
 * forwards it to `schema.normalize` as a trailing `parentEntity` argument —
 * see `SchemaSimple.normalize`.
 */
interface Visit {
    (schema: any, value: any, parent: any, key: any): any;
    creating?: boolean;
}
/** Interface specification for entities state accessor */
interface EntitiesInterface {
    keys(): IterableIterator<string>;
    entries(): IterableIterator<[string, any]>;
}
/** Get normalized Entity from store */
interface GetEntity {
    (key: string, pk: string): any;
}
/** Helpers during schema.denormalize() */
interface IDenormalizeDelegate {
    /** Recursive denormalize of nested schemas */
    unvisit(schema: any, input: any): any;
    /** Raw endpoint args. Reading this does NOT contribute to cache
     * invalidation — if your output varies with args, register an `argsKey`
     * so the cache buckets correctly. */
    readonly args: readonly any[];
    /** Adds a memoization dimension to the surrounding cache frame.
     * `fn` must be referentially stable (it doubles as the cache path key).
     * Returns `fn(args)` for convenience. */
    argsKey(fn: (args: readonly any[]) => string | undefined): string | undefined;
}
/** Helpers during schema.normalize() */
interface INormalizeDelegate {
    /** Recursive normalize of nested schemas */
    visit: Visit;
    /** Raw endpoint args for this normalize call */
    readonly args: readonly any[];
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
/** Defines a networking endpoint */
interface EndpointInterface<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined, M extends boolean | undefined = boolean | undefined> extends EndpointExtraOptions<F> {
    (...args: Parameters<F>): ReturnType<F>;
    key(...args: Parameters<F>): string;
    readonly sideEffect?: M;
    readonly schema?: S;
}

type Updater = (result: any, ...args: any) => Record<string, (...args: any) => any>;
interface SuccessFixtureEndpoint<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> {
    readonly endpoint: E;
    readonly args: Readonly<Parameters<E>>;
    readonly response: ResolveType<E> | ((...args: Parameters<E>) => ResolveType<E>);
    readonly error?: false;
    /** Number of miliseconds to wait before resolving */
    readonly delay?: number;
    /** Waits to run `response()` after `delay` time */
    readonly delayCollapse?: boolean;
}
interface ResponseInterceptor<T = any, E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
} = EndpointInterface & {
    testKey(key: string): boolean;
}> {
    readonly endpoint: E;
    response(this: T, ...args: Parameters<E>): ResolveType<E>;
    /** Number of miliseconds (or function that returns) to wait before resolving */
    readonly delay?: number | ((...args: Parameters<E>) => number);
    /** Waits to run `response()` after `delay` time */
    readonly delayCollapse?: boolean;
}
interface FetchInterceptor<T = any, E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
} = EndpointInterface & {
    testKey(key: string): boolean;
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
}> {
    readonly endpoint: E;
    fetchResponse(this: T, input: RequestInfo, init: RequestInit): ResolveType<E>;
    /** Number of miliseconds (or function that returns) to wait before resolving */
    readonly delay?: number | ((...args: Parameters<E>) => number);
    /** Waits to run `response()` after `delay` time */
    readonly delayCollapse?: boolean;
}
/** Interceptors match and compute dynamic responses based on args
 *
 * @see https://dataclient.io/docs/api/Fixtures#interceptor
 */
type Interceptor<T = any, E extends EndpointInterface & {
    update?: Updater;
    testKey(key: string): boolean;
    fetchResponse?(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend?(options: any): any;
} = EndpointInterface & {
    testKey(key: string): boolean;
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
}> = ResponseInterceptor<T, E> | (E extends ({
    fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
    extend(options: any): any;
}) ? FetchInterceptor<T, E> : never);
interface ErrorFixtureEndpoint<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> {
    readonly endpoint: E;
    readonly args: Readonly<Parameters<E>>;
    readonly response: any;
    readonly error: true;
    /** Number of miliseconds to wait before resolving */
    readonly delay?: number;
    /** Waits to run `response()` after `delay` time */
    readonly delayCollapse?: boolean;
}
type FixtureEndpoint<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> = SuccessFixtureEndpoint<E> | ErrorFixtureEndpoint<E>;
/** Represents a successful response
 *
 * @see https://dataclient.io/docs/api/Fixtures#successfixture
 */
type SuccessFixture<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> = SuccessFixtureEndpoint<E>;
/** Represents a failed/errored response
 *
 * @see https://dataclient.io/docs/api/Fixtures#errorfixtures
 */
type ErrorFixture<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> = ErrorFixtureEndpoint<E>;
/** Represents a static response
 *
 * @see https://dataclient.io/docs/api/Fixtures
 */
type Fixture<E extends EndpointInterface & {
    update?: Updater;
} = EndpointInterface> = FixtureEndpoint<E>;

interface MockProps<T = any> {
    readonly fixtures?: (Fixture | Interceptor<T>)[];
    getInitialInterceptorData?: () => T;
}

declare function MockController<TBase extends new (...args: any[]) => Controller<any>, T>(Base: TBase, { fixtures, getInitialInterceptorData, }: MockProps<T>): TBase;

declare function collapseFixture(fixture: Fixture | ResponseInterceptor, args: any[], interceptorData: any): Promise<{
    response: any;
    error: boolean | undefined;
}>;

declare function createFixtureMap(fixtures?: (Fixture | Interceptor)[]): readonly [Map<string, Fixture>, Interceptor[]];

declare function mockInitialState(fixtures?: Fixture[]): State<unknown>;

export { type ErrorFixture, type ErrorFixtureEndpoint, type FetchInterceptor, type Fixture, type FixtureEndpoint, type Interceptor, MockController, type MockProps, type ResponseInterceptor, type SuccessFixture, type SuccessFixtureEndpoint, collapseFixture, createFixtureMap, mockInitialState };
