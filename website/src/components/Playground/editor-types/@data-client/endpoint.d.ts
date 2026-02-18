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
type NormalizedEntity<T> = T extends ({
    prototype: infer U;
    schema: infer S;
}) ? {
    [K in Exclude<keyof U, keyof S>]: U[K];
} & {
    [K in keyof S]: string;
} : never;
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
type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> = keyof S['schema'] extends never ? S['prototype'] : string extends keyof S['schema'] ? S['prototype'] : S['prototype'] & {
    [K in keyof S['schema']]: DenormalizeNullable<S['schema'][K]>;
};
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
interface EntityMap<T = any> {
    readonly [k: string]: EntityInterface<T>;
}

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

/** Get the Params type for a given Shape */
type EndpointParam<E> = E extends (first: infer A, ...rest: any) => any ? A : E extends {
    key: (first: infer A, ...rest: any) => any;
} ? A : never;
/** What the function's promise resolves to */
type ResolveType<E extends (...args: any) => any> = ReturnType<E> extends Promise<infer R> ? R : never;
type PartialParameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? Partial<P> : never;
type EndpointToFunction<E extends (...args: any) => Promise<any>> = (this: E, ...args: Parameters<E>) => ReturnType<E>;

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
interface SchemaClass<T = any, Args extends readonly any[] = any> extends SchemaSimple<T, Args> {
    _normalizeNullable(): any;
    _denormalizeNullable(): any;
}
interface EntityInterface<T = any> extends SchemaSimple {
    createIfValid(props: any): any;
    pk(params: any, parent: any, key: string | undefined, args: any[]): string | number | undefined;
    readonly key: string;
    indexes?: any;
    prototype: T;
}
interface Mergeable {
    key: string;
    merge(existing: any, incoming: any): any;
    mergeWithStore(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
    mergeMetaWithStore(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
}
/** Represents Array or Values */
interface PolymorphicInterface<T = any, Args extends any[] = any[]> extends SchemaSimple<T, Args> {
    readonly schema: any;
    schemaKey(): string;
    _normalizeNullable(): any;
    _denormalizeNullable(): any;
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
    creating?: boolean;
}
/** Used in denormalize. Lookup to find an entity in the store table */
interface EntityPath {
    key: string;
    pk: string;
}
type IndexPath = [key: string, index: string, value: string];
type EntitiesPath = [key: string];
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
/** Defines a networking endpoint */
interface EndpointInterface<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined, M extends boolean | undefined = boolean | undefined> extends EndpointExtraOptions<F> {
    (...args: Parameters<F>): ReturnType<F>;
    key(...args: Parameters<F>): string;
    readonly sideEffect?: M;
    readonly schema?: S;
}
/** To change values on the server */
interface MutateEndpoint<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined> extends EndpointInterface<F, S, true> {
    sideEffect: true;
}
/** For retrieval requests */
type ReadEndpoint<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined> = EndpointInterface<F, S, undefined>;

interface EndpointOptions<F extends FetchFunction = FetchFunction, S extends Schema | undefined = undefined, M extends boolean | undefined = false> extends EndpointExtraOptions<F> {
    key?: (...args: Parameters<F>) => string;
    sideEffect?: M;
    schema?: S;
    [k: string]: any;
}
interface EndpointExtendOptions<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined, M extends boolean | undefined = boolean | undefined> extends EndpointOptions<F, S, M> {
    fetch?: FetchFunction;
}
type KeyofEndpointInstance = keyof EndpointInstance<FetchFunction>;
type ExtendedEndpoint<O extends EndpointExtendOptions<F>, E extends EndpointInstance<FetchFunction, Schema | undefined, boolean | undefined>, F extends FetchFunction> = EndpointInstance<'fetch' extends keyof O ? Exclude<O['fetch'], undefined> : E['fetch'], 'schema' extends keyof O ? O['schema'] : E['schema'], 'sideEffect' extends keyof O ? O['sideEffect'] : E['sideEffect']> & Omit<O, KeyofEndpointInstance> & Omit<E, KeyofEndpointInstance>;
/**
 * Defines an async data source.
 * @see https://dataclient.io/docs/api/Endpoint
 */
interface EndpointInstance<F extends (...args: any) => Promise<any> = FetchFunction, S extends Schema | undefined = Schema | undefined, M extends boolean | undefined = boolean | undefined> extends EndpointInstanceInterface<F, S, M> {
    extend<E extends EndpointInstance<(...args: any) => Promise<any>, Schema | undefined, boolean | undefined>, O extends EndpointExtendOptions<F> & Partial<Omit<E, keyof EndpointInstance<FetchFunction>>> & Record<string, unknown>>(this: E, options: Readonly<O>): ExtendedEndpoint<typeof options, E, F>;
}
/**
 * Defines an async data source.
 * @see https://dataclient.io/docs/api/Endpoint
 */
interface EndpointInstanceInterface<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined, M extends boolean | undefined = boolean | undefined> extends EndpointInterface<F, S, M> {
    constructor: EndpointConstructor;
    /**
     * Calls the function, substituting the specified object for the this value of the function, and the specified array for the arguments of the function.
     * @param thisArg The object to be used as the this object.
     * @param argArray A set of arguments to be passed to the function.
     */
    apply<E extends FetchFunction>(this: E, thisArg: ThisParameterType<E>, argArray?: Parameters<E>): ReturnType<E>;
    /**
     * Calls a method of an object, substituting another object for the current object.
     * @param thisArg The object to be used as the current object.
     * @param argArray A list of arguments to be passed to the method.
     */
    call<E extends FetchFunction>(this: E, thisArg: ThisParameterType<E>, ...argArray: Parameters<E>): ReturnType<E>;
    /**
     * For a given function, creates a bound function that has the same body as the original function.
     * The this object of the bound function is associated with the specified object, and has the specified initial parameters.
     * @param thisArg An object to which the this keyword can refer inside the new function.
     * @param argArray A list of arguments to be passed to the new function.
     */
    bind<E extends FetchFunction, P extends PartialParameters<E>>(this: E, thisArg: ThisParameterType<E>, ...args: readonly [...P]): EndpointInstance<(...args: readonly [...RemoveArray<Parameters<E>, P>]) => ReturnType<E>, S, M> & Omit<E, keyof EndpointInstance<FetchFunction>>;
    /** Returns a string representation of a function. */
    toString(): string;
    prototype: any;
    readonly length: number;
    arguments: any;
    caller: F;
    key(...args: Parameters<F>): string;
    readonly sideEffect: M;
    readonly schema: S;
    fetch: F;
    /** @see https://dataclient.io/rest/api/Endpoint#testKey */
    testKey(key: string): boolean;
}
interface EndpointConstructor {
    /**
     * Defines an async data source.
     * @see https://dataclient.io/docs/api/Endpoint
     */
    new <F extends (this: EndpointInstance<FetchFunction> & E, params?: any, body?: any) => Promise<any>, S extends Schema | undefined = undefined, M extends boolean | undefined = false, E extends Record<string, any> = {}>(fetchFunction: F, options?: EndpointOptions<F, S, M> & E): EndpointInstance<F, S, M> & E;
    readonly prototype: Function;
}
interface ExtendableEndpointConstructor {
    /**
     * Defines an async data source.
     * @see https://dataclient.io/docs/api/Endpoint
     */
    new <F extends (this: EndpointInstanceInterface<FetchFunction> & E, params?: any, body?: any) => Promise<any>, S extends Schema | undefined = undefined, M extends boolean | undefined = false, E extends Record<string, any> = {}>(RestFetch: F, options?: Readonly<EndpointOptions<F, S, M>> & E): EndpointInstanceInterface<F, S, M> & E;
    readonly prototype: Function;
}
type RemoveArray<Orig extends any[], Rem extends any[]> = Rem extends [any, ...infer RestRem] ? Orig extends [any, ...infer RestOrig] ? RemoveArray<RestOrig, RestRem> : never : Orig;

declare let Endpoint: EndpointConstructor;


declare let ExtendableEndpoint: ExtendableEndpointConstructor;

/**
 * Entity defines a single (globally) unique object.
 * @see https://dataclient.io/rest/api/EntityMixin
 */
interface IEntityClass<TBase extends Constructor = any> {
    toJSON(): {
        name: string;
        schema: {
            [k: string]: Schema;
        };
        key: string;
    };
    /** Defines nested entities
     *
     * @see https://dataclient.io/rest/api/Entity#schema
     */
    schema: {
        [k: string]: Schema;
    };
    /** Returns the globally unique identifier for the static Entity
     *
     * @see https://dataclient.io/rest/api/Entity#key
     */
    key: string;
    /** Defines indexes to enable lookup by
     *
     * @see https://dataclient.io/rest/api/Entity#indexes
     */
    indexes?: readonly string[] | undefined;
    /**
     * A unique identifier for each Entity
     *
     * @see https://dataclient.io/rest/api/Entity#pk
     * @param [value] POJO of the entity or subset used
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     * @param [args] ...args sent to Endpoint
     */
    pk<T extends (abstract new (...args: any[]) => IEntityInstance & InstanceType<TBase>) & IEntityClass & TBase>(this: T, value: Partial<AbstractInstanceType<T>>, parent?: any, key?: string, args?: any[]): string | number | undefined;
    /** Return true to merge incoming data; false keeps existing entity
     *
     * @see https://dataclient.io/docs/api/Entity#shouldUpdate
     */
    shouldUpdate(existingMeta: {
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): boolean;
    /** Determines the order of incoming entity vs entity already in store
     *
     * @see https://dataclient.io/docs/api/Entity#shouldReorder
     * @returns true if incoming entity should be first argument of merge()
     */
    shouldReorder(existingMeta: {
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): boolean;
    /** Creates new instance copying over defined values of arguments
     *
     * @see https://dataclient.io/docs/api/Entity#merge
     */
    merge(existing: any, incoming: any): any;
    /** Run when an existing entity is found in the store
     *
     * @see https://dataclient.io/docs/api/Entity#mergeWithStore
     */
    mergeWithStore(existingMeta: {
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): any;
    /** Run when an existing entity is found in the store
     *
     * @see https://dataclient.io/docs/api/Entity#mergeMetaWithStore
     */
    mergeMetaWithStore(existingMeta: {
        expiresAt: number;
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        expiresAt: number;
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): {
        expiresAt: number;
        date: number;
        fetchedAt: number;
    };
    /** Factory method to convert from Plain JS Objects.
     *
     * @param [props] Plain Object of properties to assign.
     */
    fromJS<T extends (abstract new (...args: any[]) => IEntityInstance & InstanceType<TBase>) & IEntityClass & TBase>(this: T, props?: Partial<AbstractInstanceType<T>>): AbstractInstanceType<T>;
    /** Called when denormalizing an entity to create an instance when 'valid'
     *
     * @param [props] Plain Object of properties to assign.
     * @see https://dataclient.io/rest/api/Entity#createIfValid
     */
    createIfValid<T extends (abstract new (...args: any[]) => IEntityInstance & InstanceType<TBase>) & IEntityClass & TBase>(this: T, props: Partial<AbstractInstanceType<T>>): AbstractInstanceType<T> | undefined;
    /** Do any transformations when first receiving input
     *
     * @see https://dataclient.io/rest/api/Entity#process
     */
    process(input: any, parent: any, key: string | undefined, args: any[]): any;
    normalize(input: any, parent: any, key: string | undefined, args: any[], visit: (...args: any) => any, snapshot: {
        getEntity: any;
        setEntity: any;
    }): any;
    /** Do any transformations when first receiving input
     *
     * @see https://dataclient.io/rest/api/Entity#validate
     */
    validate(processedEntity: any): string | undefined;
    /** Builds a key access the entity without endpoint results
     *
     * @see https://dataclient.io/rest/api/Entity#queryKey
     */
    queryKey(args: readonly any[], unvisit: any, delegate: IQueryDelegate): any;
    denormalize<T extends (abstract new (...args: any[]) => IEntityInstance & InstanceType<TBase>) & IEntityClass & TBase>(this: T, input: any, args: readonly any[], unvisit: (schema: any, input: any) => any): AbstractInstanceType<T>;
    /** All instance defaults set */
    readonly defaults: any;
}
interface IEntityInstance {
    /**
     * A unique identifier for each Entity
     *
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     * @param [args] ...args sent to Endpoint
     */
    pk(parent?: any, key?: string, args?: readonly any[]): string | number | undefined;
}
type Constructor = abstract new (...args: any[]) => {};
type IDClass = abstract new (...args: any[]) => {
    id: string | number | undefined;
};
type PKClass = abstract new (...args: any[]) => {
    pk(parent?: any, key?: string, args?: readonly any[]): string | number | undefined;
};
type ValidSchemas<TInstance> = {
    [k in keyof TInstance]?: Schema;
};
type EntityOptions<TInstance extends {}> = {
    readonly schema?: ValidSchemas<TInstance>;
    readonly pk?: ((value: TInstance, parent?: any, key?: string) => string | number | undefined) | keyof TInstance;
    readonly key?: string;
} & {
    readonly [K in Extract<keyof IEntityClass, 'process' | 'merge' | 'expiresAt' | 'createIfValid' | 'mergeWithStore' | 'validate' | 'shouldReorder' | 'shouldUpdate'>]?: IEntityClass<abstract new (...args: any[]) => TInstance>[K];
};
interface RequiredPKOptions<TInstance extends {}> extends EntityOptions<TInstance> {
    readonly pk: ((value: TInstance, parent?: any, key?: string) => string | number | undefined) | keyof TInstance;
}

/**
 * Turns any class into an Entity.
 * @see https://dataclient.io/rest/api/EntityMixin
 */
declare function EntityMixin<TBase extends PKClass>(Base: TBase, opt?: EntityOptions<InstanceType<TBase>>): IEntityClass<TBase> & TBase;
declare function EntityMixin<TBase extends IDClass>(Base: TBase, opt?: EntityOptions<InstanceType<TBase>>): IEntityClass<TBase> & TBase & (new (...args: any[]) => IEntityInstance);
declare function EntityMixin<TBase extends Constructor>(Base: TBase, opt: RequiredPKOptions<InstanceType<TBase>>): IEntityClass<TBase> & TBase & (new (...args: any[]) => IEntityInstance);

declare class PolymorphicSchema {
    private _schemaAttribute;
    protected schema: any;
    constructor(definition: any, schemaAttribute?: string | ((...args: any) => any));
    get isSingleSchema(): boolean;
    define(definition: any): void;
    getSchemaAttribute(input: any, parent: any, key: any): any;
    inferSchema(input: any, parent: any, key: any): any;
    schemaKey(): string;
    normalizeValue(value: any, parent: any, key: any, args: any[], visit: Visit): any;
    denormalizeValue(value: any, unvisit: any): any;
}

type ProcessableEntity = EntityInterface & {
    process: any;
};
/** Structural type for hoistable polymorphic schemas like Union */
type HoistablePolymorphic = {
    readonly _hoistable: true;
    schema: any;
    getSchemaAttribute: (...args: any) => any;
};
/**
 * Marks entity as Invalid.
 *
 * This triggers suspense for all endpoints requiring it.
 * Optional (like variable sized Array and Values) will simply remove the item.
 * @see https://dataclient.io/rest/api/Invalidate
 */
declare class Invalidate<E extends ProcessableEntity | Record<string, ProcessableEntity> | HoistablePolymorphic> extends PolymorphicSchema {
    /**
     * Marks entity as Invalid.
     *
     * This triggers suspense for all endpoints requiring it.
     * Optional (like variable sized Array and Values) will simply remove the item.
     * @see https://dataclient.io/rest/api/Invalidate
     */
    constructor(entity: E, schemaAttribute?: E extends HoistablePolymorphic ? undefined : E extends Record<string, ProcessableEntity> ? string | ((input: any, parent: any, key: any) => string) : undefined);
    get key(): string;
    normalize(input: any, parent: any, key: string | undefined, args: any[], visit: (...args: any) => any, delegate: INormalizeDelegate): string | {
        id: string;
        schema: string;
    };
    queryKey(_args: any, _unvisit: unknown, _delegate: unknown): undefined;
    denormalize(id: string | {
        id: string;
        schema: string;
    }, args: readonly any[], unvisit: (schema: any, input: any) => any): E extends ProcessableEntity ? AbstractInstanceType<E> : AbstractInstanceType<E[keyof E]>;
    _denormalizeNullable(): (E extends ProcessableEntity ? AbstractInstanceType<E> : AbstractInstanceType<E[keyof E]>) | undefined;
    _normalizeNullable(): string | undefined;
}

/**
 * Programmatic cache reading
 *
 * @see https://dataclient.io/rest/api/Query
 */
declare class Query<S extends Queryable | {
    [k: string]: Queryable;
}, P extends (entries: Denormalize<S>, ...args: any) => any> implements SchemaSimple<ReturnType<P> | undefined, ProcessParameters<P, S>> {
    schema: S;
    process: P;
    /**
     * Programmatic cache reading
     *
     * @see https://dataclient.io/rest/api/Query
     */
    constructor(schema: S, process: P);
    normalize(...args: any): any;
    denormalize(input: {}, args: any, unvisit: any): ReturnType<P>;
    queryKey(args: ProcessParameters<P, S>, unvisit: (schema: any, args: any) => any): any;
    _denormalizeNullable: (input: {}, args: readonly any[], unvisit: (schema: any, input: any) => any) => ReturnType<P> | undefined;
    _normalizeNullable: () => NormalizeNullable<S>;
}
type ProcessParameters<P, S extends Queryable | {
    [k: string]: Queryable;
}> = P extends (entries: any, ...args: infer Par) => any ? Par extends [] ? SchemaArgs<S> : Par & SchemaArgs<S> : SchemaArgs<S>;

type CollectionOptions<Args extends any[] = DefaultArgs, Parent = any> = ({
    /** Defines lookups for Collections nested in other schemas.
     *
     * @see https://dataclient.io/rest/api/Collection#nestKey
     */
    nestKey?: (parent: Parent, key: string) => Record<string, any>;
} | {
    /** Defines lookups top-level Collections using ...args.
     *
     * @see https://dataclient.io/rest/api/Collection#argsKey
     */
    argsKey?: (...args: Args) => Record<string, any>;
}) & ({
    /** Sets a default createCollectionFilter for addWith(), push, unshift, and assign.
     *
     * @see https://dataclient.io/rest/api/Collection#createcollectionfilter
     */
    createCollectionFilter?: (...args: Args) => (collectionKey: Record<string, string>) => boolean;
} | {
    /** Test to determine which arg keys should **not** be used for filtering results.
     *
     * @see https://dataclient.io/rest/api/Collection#nonfilterargumentkeys
     */
    nonFilterArgumentKeys?: ((key: string) => boolean) | string[] | RegExp;
});

/** Schema when adding to an Array Collection
 * Conceptually only returns a single item
 */
type CollectionArrayAdder<S extends PolymorphicInterface> = S extends ({
    denormalize(...args: any): any[];
    schema: infer T;
}) ? T : never;
/** Schema to remove/move (by value) from a Collection(Array|Values)
 * Conceptually only returns a single item
 */
type CollectionArrayOrValuesAdder<S extends PolymorphicInterface> = S extends ({
    denormalize(...args: any): any;
    schema: infer T;
}) ? T : never;
interface CollectionInterface<S extends PolymorphicInterface = any, Args extends any[] = any[], Parent = any> {
    /** Constructs a custom creation schema for this collection
     *
     * @see https://dataclient.io/rest/api/Collection#addWith
     */
    addWith<P extends any[] = Args>(merge: (existing: any, incoming: any) => any, createCollectionFilter?: (...args: P) => (collectionKey: Record<string, string>) => boolean): Collection<S, P>;
    readonly cacheWith: object;
    readonly schema: S;
    readonly key: string;
    /**
     * A unique identifier for each Collection
     *
     * Calls argsKey or nestKey depending on which are specified, and then serializes the result for the pk string.
     *
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     * @param [args] ...args sent to Endpoint
     * @see https://dataclient.io/docs/api/Collection#pk
     */
    pk(value: any, parent: any, key: string, args: any[]): string;
    normalize(input: any, parent: Parent, key: string, args: any[], visit: (...args: any) => any, delegate: INormalizeDelegate): string;
    /** Creates new instance copying over defined values of arguments
     *
     * @see https://dataclient.io/docs/api/Collection#merge
     */
    merge(existing: any, incoming: any): any;
    /** Determines the order of incoming Collection vs Collection already in store
     *
     * @see https://dataclient.io/docs/api/Collection#shouldReorder
     * @returns true if incoming Collection should be first argument of merge()
     */
    shouldReorder(existingMeta: {
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): boolean;
    /** Run when an existing Collection is found in the store
     *
     * @see https://dataclient.io/docs/api/Collection#mergeWithStore
     */
    mergeWithStore(existingMeta: {
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): any;
    mergeMetaWithStore(existingMeta: {
        expiresAt: number;
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        expiresAt: number;
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): {
        expiresAt: number;
        date: number;
        fetchedAt: number;
    };
    /** Builds a key access the Collection without endpoint results
     *
     * @see https://dataclient.io/rest/api/Collection#queryKey
     */
    queryKey(args: Args, unvisit: unknown, delegate: unknown): any;
    createIfValid: (value: any) => any | undefined;
    denormalize(input: any, args: readonly any[], unvisit: (schema: any, input: any) => any): ReturnType<S['denormalize']>;
    _denormalizeNullable(): ReturnType<S['_denormalizeNullable']>;
    _normalizeNullable(): ReturnType<S['_normalizeNullable']>;
    /** Schema to place at the *end* of this Collection
     * @see https://dataclient.io/rest/api/Collection#push
     */
    push: CollectionArrayAdder<S>;
    /** Schema to place at the *beginning* of this Collection
     * @see https://dataclient.io/rest/api/Collection#unshift
     */
    unshift: CollectionArrayAdder<S>;
    /** Schema to merge with a Values Collection
     * @see https://dataclient.io/rest/api/Collection#assign
     */
    assign: S extends {
        denormalize(...args: any): Record<string, unknown>;
    } ? Collection<S, Args, Parent> : never;
    /** Schema to remove (by value) from a Collection(Array|Values)
     * @see https://dataclient.io/rest/api/Collection#remove
     */
    remove: CollectionArrayOrValuesAdder<S>;
    /** Schema to move items between Collections (remove from old, add to new)
     * @see https://dataclient.io/rest/api/Collection#move
     */
    move: CollectionArrayOrValuesAdder<S>;
}
type CollectionFromSchema<S extends any[] | PolymorphicInterface = any, Args extends any[] = DefaultArgs, Parent = any> = CollectionInterface<S extends any[] ? Array$1<S[number]> : S, Args, Parent>;
interface CollectionConstructor {
    /**
     * Entities but for Arrays instead of classes
     * @see https://dataclient.io/rest/api/Collection
     */
    new <S extends SchemaSimple[] | PolymorphicInterface = any, Args extends any[] = DefaultArgs, Parent = any>(schema: S, options?: CollectionOptions<Args, Parent>): CollectionFromSchema<S, Args, Parent>;
    readonly prototype: CollectionInterface;
}
type StrategyFunction<T> = (value: any, parent: any, key: string) => T;
type SchemaFunction<K = string, Args = any> = (value: Args, parent: any, key: string) => K;
type MergeFunction = (entityA: any, entityB: any) => any;
type SchemaAttributeFunction<S extends Schema> = (value: any, parent: any, key: string) => S;
type UnionResult<Choices extends EntityMap> = {
    id: string;
    schema: keyof Choices;
};
type DefaultArgs = [] | [urlParams: Record<string, any>] | [urlParams: Record<string, any>, body: any];

/**
 * Represents arrays
 * @see https://dataclient.io/rest/api/Array
 */
declare class Array$1<S extends Schema = Schema> implements SchemaClass {
  /**
   * Represents arrays
   * @see https://dataclient.io/rest/api/Array
   */
  constructor(
    definition: S,
    schemaAttribute?: S extends EntityMap<infer T> ?
      keyof T | SchemaFunction<keyof S>
    : undefined,
  );

  define(definition: Schema): void;
  readonly isSingleSchema: S extends EntityMap ? false : true;
  schemaKey(): string;
  readonly schema: S;
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): (S extends EntityMap ? UnionResult<S> : Normalize<S>)[];

  _normalizeNullable():
    | (S extends EntityMap ? UnionResult<S> : Normalize<S>)[]
    | undefined;

  _denormalizeNullable():
    | (S extends EntityMap<infer T> ? T : Denormalize<S>)[]
    | undefined;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): (S extends EntityMap<infer T> ? T : Denormalize<S>)[];

  queryKey(
    args: readonly any[],
    unvisit: (...args: any) => any,
    delegate: any,
  ): undefined;
}

/**
 * Retrieves all entities in cache
 *
 * @see https://dataclient.io/rest/api/All
 */
declare class All<
  S extends EntityMap | EntityInterface = EntityMap | EntityInterface,
> implements SchemaClass {
  /**
   * Retrieves all entities in cache
   *
   * @see https://dataclient.io/rest/api/All
   */
  constructor(
    definition: S,
    schemaAttribute?: S extends EntityMap<infer T> ?
      keyof T | SchemaFunction<keyof S>
    : undefined,
  );

  define(definition: Schema): void;
  readonly isSingleSchema: S extends EntityMap ? false : true;
  schemaKey(): string;
  readonly schema: S;
  schemaKey(): string;
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): (S extends EntityMap ? UnionResult<S> : Normalize<S>)[];

  _normalizeNullable():
    | (S extends EntityMap ? UnionResult<S> : Normalize<S>)[]
    | undefined;

  _denormalizeNullable():
    | (S extends EntityMap<infer T> ? T : Denormalize<S>)[]
    | undefined;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): (S extends EntityMap<infer T> ? T : Denormalize<S>)[];

  queryKey(
    // TODO: hack for now to allow for variable arg combinations with Query
    args: [] | [unknown],
    unvisit: (...args: any) => any,
    delegate: IQueryDelegate,
  ): any;
}

/**
 * Represents objects with statically known members
 * @see https://dataclient.io/rest/api/Object
 */
declare class Object$1<
  O extends Record<string, any> = Record<string, any>,
> implements SchemaClass {
  /**
   * Represents objects with statically known members
   * @see https://dataclient.io/rest/api/Object
   */
  constructor(definition: O);
  define(definition: Schema): void;
  readonly schema: O;
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): NormalizeObject<O>;

  _normalizeNullable(): NormalizedNullableObject<O>;

  _denormalizeNullable(): DenormalizeNullableObject<O>;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): DenormalizeObject<O>;

  queryKey(
    args: ObjectArgs<O>,
    unvisit: (...args: any) => any,
    delegate: IQueryDelegate,
  ): any;
}

type RequiredMember<
  O extends Record<string | number | symbol, unknown>,
  Required extends keyof O,
> = {
  [K in Required]: O[K];
};

type UnionSchemaToArgs<
  Choices extends EntityMap,
  SchemaAttribute extends
    | keyof AbstractInstanceType<Choices[keyof Choices]>
    | SchemaFunction<keyof Choices>,
> =
  SchemaAttribute extends keyof AbstractInstanceType<Choices[keyof Choices]> ?
    RequiredMember<
      AbstractInstanceType<Choices[keyof Choices]>,
      SchemaAttribute
    >
  : SchemaAttribute extends (value: infer Args, ...rest: any) => unknown ? Args
  : never;

/**
 * Represents polymorphic values.
 * @see https://dataclient.io/rest/api/Union
 */
interface UnionConstructor {
  /**
   * Represents polymorphic values.
   * @see https://dataclient.io/rest/api/Union
   */
  new <
    Choices extends EntityMap,
    SchemaAttribute extends
      | keyof AbstractInstanceType<Choices[keyof Choices]>
      | SchemaFunction<keyof Choices>,
  >(
    definition: Choices,
    schemaAttribute: SchemaAttribute,
  ): UnionInstance<
    Choices,
    Partial<UnionSchemaToArgs<Choices, SchemaAttribute>> &
      Partial<AbstractInstanceType<Choices[keyof Choices]>>
  >;

  readonly prototype: UnionInstance;
}

/**
 * Represents polymorphic values.
 * @see https://dataclient.io/rest/api/Union
 */
interface UnionInstance<
  Choices extends EntityMap = any,
  Args extends EntityFields<AbstractInstanceType<Choices[keyof Choices]>> =
    EntityFields<AbstractInstanceType<Choices[keyof Choices]>>,
> {
  readonly _hoistable: true;
  define(definition: Schema): void;
  inferSchema: SchemaAttributeFunction<Choices[keyof Choices]>;
  getSchemaAttribute: SchemaFunction<keyof Choices>;
  schemaKey(): string;
  readonly schema: Choices;
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): UnionResult<Choices>;

  _normalizeNullable(): UnionResult<Choices> | undefined;

  _denormalizeNullable():
    | AbstractInstanceType<Choices[keyof Choices]>
    | undefined;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): AbstractInstanceType<Choices[keyof Choices]>;

  queryKey(
    args: [Args],
    unvisit: (...args: any) => any,
    delegate: IQueryDelegate,
  ): { id: any; schema: string };
}

/**
 * Represents polymorphic values.
 * @see https://dataclient.io/rest/api/Union
 */
declare let UnionRoot: UnionConstructor;

/**
 * Represents polymorphic values.
 * @see https://dataclient.io/rest/api/Union
 */
declare class Union<
  Choices extends EntityMap,
  SchemaAttribute extends
    | keyof AbstractInstanceType<Choices[keyof Choices]>
    | SchemaFunction<keyof Choices>,
> extends UnionRoot<Choices, SchemaAttribute> {}

/**
 * Represents variably sized objects
 * @see https://dataclient.io/rest/api/Values
 */
declare class Values<Choices extends Schema = any> implements SchemaClass {
  /**
   * Represents variably sized objects
   * @see https://dataclient.io/rest/api/Values
   */
  constructor(
    definition: Choices,
    schemaAttribute?: Choices extends EntityMap<infer T> ?
      keyof T | SchemaFunction<keyof Choices>
    : undefined,
  );

  define(definition: Schema): void;
  readonly isSingleSchema: Choices extends EntityMap ? false : true;
  schemaKey(): string;
  inferSchema: SchemaAttributeFunction<
    Choices extends EntityMap ? Choices[keyof Choices] : Choices
  >;

  getSchemaAttribute: Choices extends EntityMap ? SchemaFunction<keyof Choices>
  : false;

  readonly schema: Choices;
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): Record<
    string,
    Choices extends EntityMap ? UnionResult<Choices> : Normalize<Choices>
  >;

  _normalizeNullable():
    | Record<
        string,
        Choices extends EntityMap ? UnionResult<Choices>
        : NormalizeNullable<Choices>
      >
    | undefined;

  _denormalizeNullable(): Record<
    string,
    Choices extends EntityMap<infer T> ? T | undefined
    : DenormalizeNullable<Choices>
  >;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): Record<
    string,
    Choices extends EntityMap<infer T> ? T : Denormalize<Choices>
  >;

  queryKey(
    args: readonly any[],
    unvisit: (...args: any) => any,
    delegate: IQueryDelegate,
  ): undefined;
}

declare let CollectionRoot: CollectionConstructor;

/**
 * Entities but for Arrays instead of classes
 * @see https://dataclient.io/rest/api/Collection
 */
declare class Collection<
  S extends any[] | PolymorphicInterface = any,
  Args extends any[] = DefaultArgs,
  Parent = any,
> extends CollectionRoot<S, Args, Parent> {}

type schema_d_All<S extends EntityMap | EntityInterface = EntityMap | EntityInterface> = All<S>;
declare const schema_d_All: typeof All;
type schema_d_Collection<S extends any[] | PolymorphicInterface = any, Args extends any[] = DefaultArgs, Parent = any> = Collection<S, Args, Parent>;
declare const schema_d_Collection: typeof Collection;
type schema_d_CollectionArrayAdder<S extends PolymorphicInterface> = CollectionArrayAdder<S>;
type schema_d_CollectionArrayOrValuesAdder<S extends PolymorphicInterface> = CollectionArrayOrValuesAdder<S>;
type schema_d_CollectionConstructor = CollectionConstructor;
type schema_d_CollectionFromSchema<S extends any[] | PolymorphicInterface = any, Args extends any[] = DefaultArgs, Parent = any> = CollectionFromSchema<S, Args, Parent>;
type schema_d_CollectionInterface<S extends PolymorphicInterface = any, Args extends any[] = any[], Parent = any> = CollectionInterface<S, Args, Parent>;
declare const schema_d_CollectionRoot: typeof CollectionRoot;
type schema_d_DefaultArgs = DefaultArgs;
type schema_d_EntityInterface<T = any> = EntityInterface<T>;
type schema_d_EntityMap<T = any> = EntityMap<T>;
declare const schema_d_EntityMixin: typeof EntityMixin;
type schema_d_Invalidate<E extends ProcessableEntity | Record<string, ProcessableEntity> | HoistablePolymorphic> = Invalidate<E>;
declare const schema_d_Invalidate: typeof Invalidate;
type schema_d_MergeFunction = MergeFunction;
type schema_d_Query<S extends Queryable | {
    [k: string]: Queryable;
}, P extends (entries: Denormalize<S>, ...args: any) => any> = Query<S, P>;
declare const schema_d_Query: typeof Query;
type schema_d_SchemaAttributeFunction<S extends Schema> = SchemaAttributeFunction<S>;
type schema_d_SchemaClass<T = any, Args extends readonly any[] = any> = SchemaClass<T, Args>;
type schema_d_SchemaFunction<K = string, Args = any> = SchemaFunction<K, Args>;
type schema_d_StrategyFunction<T> = StrategyFunction<T>;
type schema_d_Union<Choices extends EntityMap, SchemaAttribute extends
    | keyof AbstractInstanceType<Choices[keyof Choices]>
    | SchemaFunction<keyof Choices>> = Union<Choices, SchemaAttribute>;
declare const schema_d_Union: typeof Union;
type schema_d_UnionConstructor = UnionConstructor;
type schema_d_UnionInstance<Choices extends EntityMap = any, Args extends EntityFields<AbstractInstanceType<Choices[keyof Choices]>> =
    EntityFields<AbstractInstanceType<Choices[keyof Choices]>>> = UnionInstance<Choices, Args>;
type schema_d_UnionResult<Choices extends EntityMap> = UnionResult<Choices>;
declare const schema_d_UnionRoot: typeof UnionRoot;
type schema_d_Values<Choices extends Schema = any> = Values<Choices>;
declare const schema_d_Values: typeof Values;
declare namespace schema_d {
  export { schema_d_All as All, Array$1 as Array, schema_d_Collection as Collection, type schema_d_CollectionArrayAdder as CollectionArrayAdder, type schema_d_CollectionArrayOrValuesAdder as CollectionArrayOrValuesAdder, type schema_d_CollectionConstructor as CollectionConstructor, type schema_d_CollectionFromSchema as CollectionFromSchema, type schema_d_CollectionInterface as CollectionInterface, schema_d_CollectionRoot as CollectionRoot, type schema_d_DefaultArgs as DefaultArgs, EntityMixin as Entity, type schema_d_EntityInterface as EntityInterface, type schema_d_EntityMap as EntityMap, schema_d_EntityMixin as EntityMixin, schema_d_Invalidate as Invalidate, type schema_d_MergeFunction as MergeFunction, Object$1 as Object, schema_d_Query as Query, type schema_d_SchemaAttributeFunction as SchemaAttributeFunction, type schema_d_SchemaClass as SchemaClass, type schema_d_SchemaFunction as SchemaFunction, type schema_d_StrategyFunction as StrategyFunction, schema_d_Union as Union, type schema_d_UnionConstructor as UnionConstructor, type schema_d_UnionInstance as UnionInstance, type schema_d_UnionResult as UnionResult, schema_d_UnionRoot as UnionRoot, schema_d_Values as Values };
}

declare const Entity_base: IEntityClass<abstract new (...args: any[]) => {
    pk(parent?: any, key?: string, args?: readonly any[]): string | number | undefined;
}> & (abstract new (...args: any[]) => {
    pk(parent?: any, key?: string, args?: readonly any[]): string | number | undefined;
});
/**
 * Entity defines a single (globally) unique object.
 * @see https://dataclient.io/rest/api/Entity
 */
declare abstract class Entity extends Entity_base {
    /** Control how automatic schema validation is handled
     *
     * `undefined`: Defaults - throw error in worst offense
     * 'warn': only ever warn
     * 'silent': Don't bother with processing at all
     *
     * Note: this only applies to non-nested members.
     */
    protected static automaticValidation?: 'warn' | 'silent';
    /** Factory method to convert from Plain JS Objects.
     *
     * @see https://dataclient.io/rest/api/Entity#fromJS
     * @param [props] Plain Object of properties to assign.
     */
    static fromJS: <T extends typeof Entity>(this: T, props?: Partial<AbstractInstanceType<T>>) => AbstractInstanceType<T>;
    /**
     * A unique identifier for each Entity
     *
     * @see https://dataclient.io/rest/api/Entity#pk
     * @param [value] POJO of the entity or subset used
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     * @param [args] ...args sent to Endpoint
     */
    static pk: <T extends typeof Entity>(this: T, value: Partial<AbstractInstanceType<T>>, parent?: any, key?: string, args?: any[]) => string | number | undefined;
    /** Do any transformations when first receiving input
     *
     * @see https://dataclient.io/rest/api/Entity#process
     */
    static process(input: any, parent: any, key: string | undefined, args: any[]): any;
    static denormalize: <T extends typeof Entity>(this: T, input: any, args: readonly any[], unvisit: (schema: any, input: any) => any) => AbstractInstanceType<T>;
}

declare function validateRequired(processedEntity: any, requiredDefaults: Record<string, unknown>): string | undefined;

/** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html#the-noinfer-utility-type */
type NI<T> = NoInfer<T>;

export { type AbstractInstanceType, All, Array$1 as Array, type CheckLoop, Collection, type DefaultArgs, type Denormalize, type DenormalizeNullable, type DenormalizeNullableObject, type DenormalizeObject, Endpoint, type EndpointExtendOptions, type EndpointExtraOptions, type EndpointInstance, type EndpointInstanceInterface, type EndpointInterface, type EndpointOptions, type EndpointParam, type EndpointToFunction, type EntitiesInterface, type EntitiesPath, Entity, type EntityFields, type EntityInterface, type EntityMap, EntityMixin, type EntityPath, type EntityTable, type ErrorTypes, type ExpiryStatusInterface, ExtendableEndpoint, type FetchFunction, type GetEntity, type GetIndex, type IEntityClass, type IEntityInstance, type INormalizeDelegate, type IQueryDelegate, type IndexPath, Invalidate, type KeyofEndpointInstance, type Mergeable, type MutateEndpoint, type NI, type NetworkError, type Normalize, type NormalizeNullable, type NormalizeObject, type NormalizedEntity, type NormalizedIndex, type NormalizedNullableObject, Object$1 as Object, type ObjectArgs, type PolymorphicInterface, Query, type Queryable, type ReadEndpoint, type RecordClass, type ResolveType, type Schema, type SchemaArgs, type SchemaClass, type SchemaSimple, type Serializable, type SnapshotInterface, Union, type UnknownError, Values, type Visit, schema_d as schema, validateRequired };
