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
interface EntityTable {
    [entityKey: string]: {
        [pk: string]: unknown;
    } | undefined;
}
/** Visits next data + schema while recurisvely normalizing */
interface Visit {
    (schema: any, value: any, parent: any, key: any, args: readonly any[]): any;
}
/** Used in denormalize. Lookup to find an entity in the store table */
interface EntityPath {
    key: string;
    pk: string;
}
type IndexPath = [key: string, index: string, value: string];
type EntitiesPath = [key: string];
type QueryPath = IndexPath | [key: string, pk: string] | EntitiesPath;
/** Returns true if a circular reference is found */
interface CheckLoop {
    (entityKey: string, pk: string, input: object): boolean;
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
type NormalizedSchema<E extends Record<string, Record<string, any> | undefined>, R> = {
    entities: E;
    result: R;
    indexes: NormalizedIndex;
    entitiesMeta: EntitiesToMeta<E>;
};
interface StoreData<E extends Record<string, Record<string, any> | undefined>> {
    entities: Readonly<E>;
    indexes: Readonly<NormalizedIndex>;
    entitiesMeta: EntitiesToMeta<E>;
}
type EntitiesToMeta<E extends Record<string, Record<string, any> | undefined>> = {
    readonly [entityKey in keyof E]: {
        readonly [pk in keyof E[entityKey]]: NormalizeMeta;
    };
};
interface NormalizeMeta {
    expiresAt: number;
    date: number;
    fetchedAt: number;
}

declare const INVALID: unique symbol;

declare function denormalize<S extends Schema>(schema: S | undefined, input: any, entities: any, args?: readonly any[]): DenormalizeNullable<S> | typeof INVALID;

declare function isEntity(schema: Schema): schema is EntityInterface;

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

declare const normalize: <S extends Schema = Schema, E extends Record<string, Record<string, any> | undefined> = Record<string, Record<string, any>>, R = NormalizeNullable<S>>(schema: S | undefined, input: any, args?: readonly any[], { entities, indexes, entitiesMeta }?: StoreData<E>, meta?: NormalizeMeta) => NormalizedSchema<E, R>;

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

interface EntityCache extends Map<string, Map<string, WeakMap<EntityInterface, WeakDependencyMap<EntityPath, object, any>>>> {
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

/** Basic POJO state interfaces for normalize side
 * Used directly as QueryDelegate, and inherited by NormalizeDelegate
 */
declare class POJODelegate extends BaseDelegate {
    entities: EntityTable;
    indexes: {
        [entityKey: string]: {
            [indexName: string]: {
                [lookup: string]: string;
            };
        };
    };
    constructor(state: {
        entities: EntityTable;
        indexes: NormalizedIndex;
    });
    protected getEntitiesObject(key: string): object | undefined;
    getEntities(key: string): EntitiesInterface | undefined;
    getEntity(key: string, pk: string): any;
    getIndex(key: string, field: string): object | undefined;
    getIndexEnd(entity: object | undefined, value: string): any;
}

/** Handles POJO state for MemoCache methods */
declare const MemoPolicy: {
    QueryDelegate: typeof POJODelegate;
    getEntities(entities: EntityTable): DenormGetEntity;
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
/** Fallback to schema if fetch function isn't defined */
type InferReturn<F extends FetchFunction, S extends Schema | undefined> = S extends undefined ? ReturnType<F> : ReturnType<F> extends unknown ? Promise<Denormalize<S>> : ReturnType<F>;

interface IndexInterface<S extends Schema = Schema, P = object> {
    key(params?: P): string;
    readonly schema: S;
}
type ArrayElement<ArrayType extends unknown[] | readonly unknown[]> = ArrayType[number];
type IndexParams<S extends Schema> = S extends ({
    indexes: readonly string[];
}) ? {
    [K in Extract<ArrayElement<S['indexes']>, keyof AbstractInstanceType<S>>]?: AbstractInstanceType<S>[K];
} : Readonly<object>;

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
type OptimisticUpdateParams<SourceSchema extends Schema | undefined, Dest extends EndpointInterface<FetchFunction, Schema, any>> = [
    Dest,
    Parameters<Dest>[0],
    UpdateFunction<SourceSchema, Exclude<Dest['schema'], undefined>>
];
type UpdateFunction<SourceSchema extends Schema | undefined, DestSchema extends Schema> = (sourceResults: Normalize<SourceSchema>, destResults: Normalize<DestSchema> | undefined) => Normalize<DestSchema>;
/** To change values on the server */
interface MutateEndpoint<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined> extends EndpointInterface<F, S, true> {
    sideEffect: true;
}
/** For retrieval requests */
type ReadEndpoint<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined> = EndpointInterface<F, S, undefined | false>;

type FetchFunction<A extends readonly any[] = any, R = any> = (...args: A) => Promise<R>;

declare function validateQueryKey(queryKey: unknown): boolean;

export { type AbstractInstanceType, type ArrayElement, BaseDelegate, type CheckLoop, type DenormGetEntity, type Denormalize, type DenormalizeNullable, type EndpointExtraOptions, type EndpointInterface, type EndpointsCache, type EntitiesInterface, type EntitiesPath, type EntityCache, type EntityInterface, type EntityPath, type EntityTable, type ErrorTypes, ExpiryStatus, type ExpiryStatusInterface, type FetchFunction, type GetEntity, type GetIndex, type IMemoPolicy, INVALID, type INormalizeDelegate, type IQueryDelegate, type IndexInterface, type IndexParams, type IndexPath, type InferReturn, MemoCache, MemoPolicy, type Mergeable, type MutateEndpoint, type NI, type NetworkError, type Normalize, type NormalizeNullable, type NormalizeReturnType, type NormalizedIndex, type NormalizedSchema, type OptimisticUpdateParams, type QueryPath, type Queryable, type ReadEndpoint, type ResolveType, type Schema, type SchemaArgs, type SchemaClass, type SchemaSimple, type Serializable, type SnapshotInterface, type UnknownError, type UpdateFunction, type Visit, WeakDependencyMap, denormalize, isEntity, normalize, validateQueryKey };
