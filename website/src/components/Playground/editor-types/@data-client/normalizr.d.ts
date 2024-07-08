type Schema = null | string | {
    [K: string]: any;
} | Schema[] | SchemaSimple | Serializable;
interface Queryable {
    queryKey(args: readonly any[], queryKey: (...args: any) => any, getEntity: GetEntity, getIndex: GetIndex): {};
}
type Serializable<T extends {
    toJSON(): string;
} = {
    toJSON(): string;
}> = (value: any) => T;
interface SchemaSimple<T = any, Args extends any[] = any[]> {
    normalize(input: any, parent: any, key: any, args: any[], visit: (...args: any) => any, addEntity: (...args: any) => any, getEntity: (...args: any) => any, checkLoop: (...args: any) => any): any;
    denormalize(input: {}, args: readonly any[], unvisit: (schema: any, input: any) => any): T;
    queryKey(args: Args, queryKey: (...args: any) => any, getEntity: GetEntity, getIndex: GetIndex): any;
}
interface SchemaClass<T = any, N = T | undefined, Args extends any[] = any[]> extends SchemaSimple<T, Args> {
    _normalizeNullable(): any;
    _denormalizeNullable(): N;
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
interface EntityTable {
    [entityKey: string]: {
        [pk: string]: unknown;
    } | undefined;
}
/** Visits next data + schema while recurisvely normalizing */
interface Visit {
    (schema: any, value: any, parent: any, key: any, args: readonly any[]): any;
}
/** Returns true if a circular reference is found */
interface CheckLoop {
    (entityKey: string, pk: string, input: object): boolean;
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

/** Attempts to infer reasonable input type to construct an Entity */
type EntityFields<U> = {
    readonly [K in keyof U as U[K] extends (...args: any) => any ? never : K]?: U[K] extends number ? U[K] | string : U[K] extends string ? U[K] | number : U[K];
};

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
type NormalizedSchema<E, R> = {
    entities: E;
    result: R;
    indexes: NormalizedIndex;
    entityMeta: {
        readonly [entityKey: string]: {
            readonly [pk: string]: {
                readonly date: number;
                readonly expiresAt: number;
                readonly fetchedAt: number;
            };
        };
    };
};
type SchemaArgs<S extends Queryable> = S extends EntityInterface<infer U> ? [EntityFields<U>] : S extends ({
    queryKey(args: infer Args, queryKey: (...args: any) => any, getEntity: any, getIndex: any): any;
}) ? Args : never;

declare function denormalize<S extends Schema>(schema: S | undefined, input: any, entities: any, args?: readonly any[]): DenormalizeNullable<S> | symbol;

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
type GetDependency<Path, K = object | symbol> = (lookup: Path) => K;
interface Dep<Path, K = object> {
    path: Path;
    entity: K;
}

interface StoreData<E> {
    entities: Readonly<E>;
    indexes: Readonly<NormalizedIndex>;
    entityMeta: {
        readonly [entityKey: string]: {
            readonly [pk: string]: {
                readonly date: number;
                readonly expiresAt: number;
                readonly fetchedAt: number;
            };
        };
    };
}
interface NormalizeMeta {
    expiresAt?: number;
    date?: number;
    fetchedAt?: number;
    args?: readonly any[];
}
declare const normalize: <S extends Schema = Schema, E extends Record<string, Record<string, any> | undefined> = Record<string, Record<string, any>>, R = NormalizeNullable<S>>(schema: S | undefined, input: any, { date, expiresAt, fetchedAt, args, }?: NormalizeMeta, { entities, indexes, entityMeta }?: StoreData<E>) => NormalizedSchema<E, R>;

interface EntityCache {
    [key: string]: {
        [pk: string]: WeakMap<EntityInterface, WeakDependencyMap<EntityPath, object, any>>;
    };
}
type EndpointsCache = WeakDependencyMap<EntityPath, object, any>;

/** Singleton to store the memoization cache for denormalization methods */
declare class MemoCache {
    /** Cache for every entity based on its dependencies and its own input */
    protected entities: EntityCache;
    /** Caches the final denormalized form based on input, entities */
    protected endpoints: EndpointsCache;
    /** Caches the queryKey based on schema, args, and any used entities or indexes */
    protected queryKeys: Record<string, WeakDependencyMap<QueryPath>>;
    /** Compute denormalized form maintaining referential equality for same inputs */
    denormalize<S extends Schema>(schema: S | undefined, input: unknown, entities: any, args?: readonly any[]): {
        data: DenormalizeNullable<S> | symbol;
        paths: EntityPath[];
    };
    /** Compute denormalized form maintaining referential equality for same inputs */
    query<S extends Schema>(schema: S, args: readonly any[], entities: Record<string, Record<string, object>> | {
        getIn(k: string[]): any;
    }, indexes: NormalizedIndex | {
        getIn(k: string[]): any;
    }, argsKey?: string): DenormalizeNullable<S> | undefined;
    buildQueryKey<S extends Schema>(schema: S, args: readonly any[], entities: Record<string, Record<string, object>> | {
        getIn(k: string[]): any;
    }, indexes: NormalizedIndex | {
        getIn(k: string[]): any;
    }, argsKey?: string): NormalizeNullable<S>;
}
type IndexPath = [key: string, field: string, value: string];
type EntitySchemaPath = [key: string] | [key: string, pk: string];
type QueryPath = IndexPath | EntitySchemaPath;

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

declare const INVALID: unique symbol;

declare function validateQueryKey(queryKey: unknown): boolean;

export { AbstractInstanceType, ArrayElement, CheckLoop, Denormalize, DenormalizeNullable, EndpointExtraOptions, EndpointInterface, EntityInterface, EntityPath, EntityTable, ErrorTypes, ExpiryStatus, ExpiryStatusInterface, FetchFunction, GetEntity, GetIndex, INVALID, IndexInterface, IndexParams, InferReturn, MemoCache, MutateEndpoint, NI, NetworkError, Normalize, NormalizeNullable, NormalizeReturnType, NormalizedIndex, NormalizedSchema, OptimisticUpdateParams, Queryable, ReadEndpoint, ResolveType, Schema, SchemaArgs, SchemaClass, SchemaSimple, Serializable, SnapshotInterface, UnknownError, UpdateFunction, Visit, WeakDependencyMap, denormalize, isEntity, normalize, validateQueryKey };
