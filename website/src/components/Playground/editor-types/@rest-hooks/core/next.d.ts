import { ErrorFluxStandardActionWithPayloadAndMeta, FSA, FSAWithPayloadAndMeta, FSAWithMeta } from 'flux-standard-action';

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
    normalize(input: any, parent: any, key: any, visit: (...args: any) => any, addEntity: (...args: any) => any, visitedEntities: Record<string, any>): any;
    denormalize(input: {}, unvisit: UnvisitFunction): [denormalized: T, found: boolean, suspend: boolean];
    denormalizeOnly?(input: {}, unvisit: (input: any, schema: any) => any): T;
    infer(args: readonly any[], indexes: NormalizedIndex, recurse: (...args: any) => any, entities: EntityTable): any;
}
interface SchemaClass<T = any, N = T | undefined> extends SchemaSimple<T> {
    _normalizeNullable(): any;
    _denormalizeNullable(): [N, boolean, boolean];
}
interface EntityInterface<T = any> extends SchemaSimple {
    createIfValid?(props: any): any;
    pk(params: any, parent?: any, key?: string): string | undefined;
    readonly key: string;
    merge(existing: any, incoming: any): any;
    expiresAt?(meta: any, input: any): number;
    mergeWithStore?(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
    useIncoming?(existingMeta: any, incomingMeta: any, existing: any, incoming: any): boolean;
    indexes?: any;
    schema: Record<string, Schema>;
    prototype: T;
}
interface UnvisitFunction {
    (input: any, schema: any): [any, boolean, boolean] | any;
    og?: UnvisitFunction;
    setLocal?: (entity: any) => void;
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
    get(entity: K, getEntity: GetEntity<K | symbol>): readonly [undefined, undefined] | [V, Path[]];
    set(dependencies: Dep<K>[], value: V): void;
}
type GetEntity<K = object | symbol> = (lookup: Path) => K;
/** Link in a chain */
declare class Link<K extends object, V> {
    next: WeakMap<K, Link<K, V>>;
    value?: V;
    journey?: Path[];
    nextPath?: Path;
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
    [K in keyof S]: S[K] extends Schema ? Denormalize$1<S[K]> : S[K];
};
type DenormalizeNullableObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? DenormalizeNullable$1<S[K]> : S[K];
};
type NormalizeObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? Normalize$1<S[K]> : S[K];
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
type DenormalizeReturnType<T> = T extends (input: any, unvisit: any) => [infer R, any, any] ? R : never;
type NormalizeReturnType<T> = T extends (...args: any) => infer R ? R : never;
type Denormalize$1<S> = S extends EntityInterface<infer U> ? U : S extends RecordClass ? AbstractInstanceType<S> : S extends SchemaClass ? DenormalizeReturnType<S['denormalize']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Denormalize$1<F>[] : S extends {
    [K: string]: any;
} ? DenormalizeObject<S> : S;
type DenormalizeNullable$1<S> = S extends EntityInterface<any> ? DenormalizeNullableNestedSchema<S> | undefined : S extends RecordClass ? DenormalizeNullableNestedSchema<S> : S extends SchemaClass ? DenormalizeReturnType<S['_denormalizeNullable']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Denormalize$1<F>[] | undefined : S extends {
    [K: string]: any;
} ? DenormalizeNullableObject<S> : S;
type Normalize$1<S> = S extends EntityInterface ? string : S extends RecordClass ? NormalizeObject<S['schema']> : S extends SchemaClass ? NormalizeReturnType<S['normalize']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Normalize$1<F>[] : S extends {
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
/** Fallback to schema if fetch function isn't defined */
type InferReturn<F extends FetchFunction, S extends Schema | undefined> = S extends undefined ? ReturnType<F> : ReturnType<F> extends unknown ? Promise<Denormalize$1<S>> : ReturnType<F>;

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
    (...args: Parameters<F>): InferReturn<F, S>;
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
    /** Enables optimistic updates for this request - uses return value as assumed network response
     * @deprecated use https://resthooks.io/docs/api/Endpoint#getoptimisticresponse instead
     */
    optimisticUpdate?(...args: Parameters<F>): ResolveType<F>;
    /** Enables optimistic updates for this request - uses return value as assumed network response */
    getOptimisticResponse?(snap: SnapshotInterface, ...args: Parameters<F>): ResolveType<F>;
    /** Determines whether to throw or fallback to */
    errorPolicy?(error: any): 'hard' | 'soft' | undefined;
    /** User-land extra data to send */
    readonly extra?: any;
}
type UpdateFunction<SourceSchema extends Schema | undefined, DestSchema extends Schema> = (sourceResults: Normalize$1<SourceSchema>, destResults: Normalize$1<DestSchema> | undefined) => Normalize$1<DestSchema>;

type FetchFunction<A extends readonly any[] = any, R = any> = (...args: A) => Promise<R>;

/** This file exists to keep compatibility with SchemaDetail, and SchemaList type hacks
 * Support can be dropped once @rest-hooks/rest@5 support is dropped
 */

type Denormalize<S> = Extract<S, EntityInterface> extends never ? Extract<S, EntityInterface[]> extends never ? Denormalize$1<S> : Denormalize$1<Extract<S, EntityInterface[]>> : Denormalize$1<Extract<S, EntityInterface>>;
type DenormalizeNullable<S> = Extract<S, EntityInterface> extends never ? Extract<S, EntityInterface[]> extends never ? DenormalizeNullable$1<S> : DenormalizeNullable$1<Extract<S, EntityInterface[]>> : DenormalizeNullable$1<Extract<S, EntityInterface>>;
type Normalize<S> = Extract<S, EntityInterface> extends never ? Extract<S, EntityInterface[]> extends never ? Normalize$1<S> : Normalize$1<Extract<S, EntityInterface[]>> : Normalize$1<Extract<S, EntityInterface>>;

type ResultEntry<E extends EndpointInterface> = E['schema'] extends undefined | null ? ResolveType<E> : Normalize<E['schema']>;
type EndpointUpdateFunction<Source extends EndpointInterface, Updaters extends Record<string, any> = Record<string, any>> = (source: ResultEntry<Source>, ...args: any) => {
    [K in keyof Updaters]: (result: Updaters[K]) => Updaters[K];
};

declare const FETCH_TYPE: "rest-hooks/fetch";
declare const RECEIVE_TYPE: "rest-hooks/receive";
declare const SET_TYPE: "rest-hooks/receive";
declare const OPTIMISTIC_TYPE: "rest-hooks/optimistic";
declare const RESET_TYPE: "rest-hooks/reset";
declare const SUBSCRIBE_TYPE: "rest-hooks/subscribe";
declare const UNSUBSCRIBE_TYPE: "rest-hook/unsubscribe";
declare const INVALIDATE_TYPE: "rest-hooks/invalidate";
declare const GC_TYPE: "rest-hooks/gc";

interface ReceiveMeta$2 {
    args: readonly any[];
    fetchedAt: number;
    date: number;
    expiresAt: number;
}
interface ReceiveActionSuccess<E extends EndpointInterface = EndpointInterface> {
    type: typeof SET_TYPE;
    endpoint: E;
    meta: ReceiveMeta$2;
    payload: ResolveType<E>;
    error?: false;
}
interface ReceiveActionError<E extends EndpointInterface = EndpointInterface> {
    type: typeof SET_TYPE;
    endpoint: E;
    meta: ReceiveMeta$2;
    payload: UnknownError;
    error: true;
}
interface FetchMeta$1 {
    args: readonly any[];
    throttle: boolean;
    resolve: (value?: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void;
    promise: PromiseLike<any>;
    createdAt: number;
    nm?: boolean;
}
interface FetchAction$2<E extends EndpointInterface = EndpointInterface> {
    type: typeof FETCH_TYPE;
    endpoint: E;
    meta: FetchMeta$1;
    payload: () => ReturnType<E>;
}
interface OptimisticAction$2<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
} = EndpointInterface & {
    update?: EndpointUpdateFunction<EndpointInterface>;
}> {
    type: typeof OPTIMISTIC_TYPE;
    endpoint: E;
    meta: ReceiveMeta$2;
    error?: boolean;
}
interface SubscribeAction$2<E extends EndpointInterface = EndpointInterface> {
    type: typeof SUBSCRIBE_TYPE;
    endpoint: E;
    meta: {
        args: readonly any[];
    };
}
interface UnsubscribeAction$2<E extends EndpointInterface = EndpointInterface> {
    type: typeof UNSUBSCRIBE_TYPE;
    endpoint: E;
    meta: {
        args: readonly any[];
    };
}
interface InvalidateAction$1 {
    type: typeof INVALIDATE_TYPE;
    meta: {
        key: string;
    };
}
interface ResetAction$2 {
    type: typeof RESET_TYPE;
    date: number;
}
interface GCAction$1 {
    type: typeof GC_TYPE;
    entities: [string, string][];
    results: string[];
}

interface CompatibleFetchMeta extends FetchMeta$1 {
    key: string;
    schema?: Schema;
    type: 'mutate' | 'read';
    update?: (result: any, ...args: any) => Record<string, (...args: any) => any>;
    options?: EndpointExtraOptions;
    optimisticResponse?: {};
}
interface CompatibleFetchAction<E extends EndpointInterface = EndpointInterface> extends FetchAction$2<E> {
    meta: CompatibleFetchMeta;
}
interface CompatibleReceiveMeta extends ReceiveMeta$2 {
    key: string;
    schema?: any;
    update?: (result: any, ...args: any) => Record<string, (...args: any) => any>;
    errorPolicy?: (error: any) => 'hard' | 'soft' | undefined;
}
interface CompatibleReceiveActionSuccess<E extends EndpointInterface = EndpointInterface> extends ReceiveActionSuccess<E> {
    meta: CompatibleReceiveMeta;
    payload: any;
}
interface CompatibleReceiveActionError<E extends EndpointInterface = EndpointInterface> extends ReceiveActionError<E> {
    meta: CompatibleReceiveMeta;
    payload: any;
}
type CompatibleReceiveAction<E extends EndpointInterface = EndpointInterface> = CompatibleReceiveActionSuccess<E> | CompatibleReceiveActionError<E>;
interface CompatibleSubscribeAction<E extends EndpointInterface = EndpointInterface> extends SubscribeAction$2<E> {
    meta: {
        args: readonly any[];
        schema: Schema | undefined;
        fetch: () => Promise<any>;
        key: string;
        options: EndpointExtraOptions | undefined;
    };
}
interface CompatibleUnsubscribeAction<E extends EndpointInterface = EndpointInterface> extends UnsubscribeAction$2<E> {
    meta: {
        args: readonly any[];
        key: string;
        options: EndpointExtraOptions | undefined;
    };
}

/** Defines the shape of a network request */
interface FetchShape<S extends Schema | undefined, Params extends Readonly<object> = Readonly<object>, Body extends Readonly<object | string> | void | unknown = Readonly<object | string> | undefined, Response = any> {
    readonly type: 'read' | 'mutate' | 'delete';
    fetch(params: Params, body?: Body): Promise<Response>;
    getFetchKey(params: Params): string;
    readonly schema: S;
    readonly options?: EndpointExtraOptions;
}

type ErrorableFSAWithPayloadAndMeta<Type extends string = string, Payload = undefined, Meta = undefined, CustomError extends Error = Error> = ErrorFluxStandardActionWithPayloadAndMeta<Type, CustomError, Meta> | NoErrorFluxStandardActionWithPayloadAndMeta<Type, Payload, Meta>;
interface NoErrorFluxStandardAction<Type extends string = string, Payload = undefined, Meta = undefined> extends FSA<Type, Payload, Meta> {
    error?: false;
}
/**
 * A Flux Standard action with a required payload property.
 */
interface NoErrorFluxStandardActionWithPayload<Type extends string = string, Payload = undefined, Meta = undefined> extends NoErrorFluxStandardAction<Type, Payload, Meta> {
    /**
     * The required `payload` property MAY be any type of value.
     * It represents the payload of the action.
     * Any information about the action that is not the type or status of the action should be part of the `payload` field.
     * By convention, if `error` is `true`, the `payload` SHOULD be an error object.
     * This is akin to rejecting a promise with an error object.
     */
    payload: Payload;
}
/**
 * A Flux Standard action with a required metadata property.
 */
interface NoErrorFluxStandardActionWithMeta<Type extends string = string, Payload = undefined, Meta = undefined> extends NoErrorFluxStandardAction<Type, Payload, Meta> {
    /**
     * The required `meta` property MAY be any type of value.
     * It is intended for any extra information that is not part of the payload.
     */
    meta: Meta;
}
/**
 * A Flux Standard action with required payload and metadata properties.
 */
type NoErrorFluxStandardActionWithPayloadAndMeta<Type extends string = string, Payload = undefined, Meta = undefined> = NoErrorFluxStandardActionWithPayload<Type, Payload, Meta> & NoErrorFluxStandardActionWithMeta<Type, Payload, Meta>;

interface ReceiveMeta$1<S extends Schema | undefined> {
    schema?: S;
    key: string;
    args?: readonly any[];
    updaters?: Record<string, UpdateFunction<S, any>>;
    update?: (result: any, ...args: any) => Record<string, (...args: any) => any>;
    fetchedAt?: number;
    date: number;
    expiresAt: number;
    errorPolicy?: (error: any) => 'hard' | 'soft' | undefined;
}
type ReceiveAction$2<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any> = ErrorableFSAWithPayloadAndMeta<typeof RECEIVE_TYPE, Payload, ReceiveMeta$1<S>>;
interface ResetAction$1 {
    type: typeof RESET_TYPE;
    date: number | Date;
}
interface FetchMeta<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any> {
    type: FetchShape<any, any>['type'];
    schema?: S;
    key: string;
    args?: readonly any[];
    updaters?: Record<string, UpdateFunction<S, any>>;
    update?: (result: any, ...args: any) => Record<string, (...args: any) => any>;
    options?: EndpointExtraOptions;
    throttle: boolean;
    resolve: (value?: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void;
    promise: PromiseLike<any>;
    createdAt: number | Date;
    optimisticResponse?: Payload;
    nm?: boolean;
}
interface FetchAction$1<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any> extends FSAWithPayloadAndMeta<typeof FETCH_TYPE, () => Promise<Payload>, FetchMeta<any, any>> {
    meta: FetchMeta<Payload, S>;
    endpoint?: undefined;
}
interface SubscribeAction$1 extends FSAWithMeta<typeof SUBSCRIBE_TYPE, undefined, any> {
    meta: {
        args?: readonly any[];
        schema: Schema | undefined;
        fetch: () => Promise<any>;
        key: string;
        options: EndpointExtraOptions | undefined;
    };
    endpoint?: undefined;
}
interface UnsubscribeAction$1 extends FSAWithMeta<typeof UNSUBSCRIBE_TYPE, undefined, any> {
    meta: {
        args?: readonly any[];
        key: string;
        options: EndpointExtraOptions | undefined;
    };
    endpoint?: undefined;
}

interface ReceiveMeta<S extends Schema | undefined> {
    schema?: S;
    key: string;
    args?: readonly any[];
    updaters?: Record<string, UpdateFunction<S, any>>;
    update?: (result: any, ...args: any) => Record<string, (...args: any) => any>;
    fetchedAt?: number;
    date: number;
    expiresAt: number;
    errorPolicy?: (error: any) => 'hard' | 'soft' | undefined;
}
type ReceiveAction$1<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any> = ErrorableFSAWithPayloadAndMeta<typeof RECEIVE_TYPE, Payload, ReceiveMeta<S>> & {
    endpoint?: EndpointInterface;
};
type OptimisticAction$1<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
} = EndpointInterface & {
    update?: EndpointUpdateFunction<EndpointInterface>;
}> = {
    type: typeof OPTIMISTIC_TYPE;
    meta: {
        schema: E['schema'];
        key: string;
        args: readonly any[];
        update?: (result: any, ...args: any) => Record<string, (...args: any) => any>;
        fetchedAt: number;
        date: number;
        expiresAt: number;
        errorPolicy?: (error: any) => 'hard' | 'soft' | undefined;
    };
    endpoint: E;
    error?: undefined;
};

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
    readonly optimistic: (ReceiveAction$1 | OptimisticAction$1)[];
    readonly lastReset: Date | number;
}

type OptimisticAction<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
} = EndpointInterface & {
    update?: EndpointUpdateFunction<EndpointInterface>;
}> = OptimisticAction$2<E>;
type InvalidateAction = InvalidateAction$1;
type ResetAction = ResetAction$2 | ResetAction$1;
type GCAction = GCAction$1;
type FetchAction<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any> = CompatibleFetchAction | FetchAction$1<Payload, S>;
type ReceiveAction<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any> = CompatibleReceiveAction | ReceiveAction$2<Payload, S>;
type SubscribeAction = CompatibleSubscribeAction | SubscribeAction$1;
type UnsubscribeAction = CompatibleUnsubscribeAction | UnsubscribeAction$1;
type CombinedActionTypes = OptimisticAction | InvalidateAction | ResetAction | GCAction | FetchAction | ReceiveAction | SubscribeAction | UnsubscribeAction;

type GenericDispatch = (value: any) => Promise<void>;
type CompatibleDispatch = (value: CombinedActionTypes) => Promise<void>;
interface ConstructorProps<D extends GenericDispatch = CompatibleDispatch> {
    dispatch?: D;
    getState?: () => State<unknown>;
    globalCache?: DenormalizeCache;
}
/**
 * Imperative control of Rest Hooks store
 * @see https://resthooks.io/docs/api/Controller
 */
declare class Controller$1<D extends GenericDispatch = CompatibleDispatch> {
    /**
     * Dispatches an action to Rest Hooks reducer.
     *
     * @see https://resthooks.io/docs/api/Controller#dispatch
     */
    readonly dispatch: D;
    /**
     * Gets the latest state snapshot that is fully committed.
     *
     * This can be useful for imperative use-cases like event handlers.
     * This should *not* be used to render; instead useSuspense() or useCache()
     * @see https://resthooks.io/docs/api/Controller#getState
     */
    readonly getState: () => State<unknown>;
    readonly globalCache: DenormalizeCache;
    constructor({ dispatch, getState, globalCache, }?: ConstructorProps<D>);
    /*************** Action Dispatchers ***************/
    /**
     * Forces refetching and suspense on useSuspense with the same Endpoint and parameters.
     * @see https://resthooks.io/docs/api/Controller#invalidate
     */
    invalidate: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) => Promise<void>;
    /**
     * Forces refetching and suspense on useSuspense on all matching endpoint result keys.
     * @see https://resthooks.io/docs/api/Controller#invalidateAll
     */
    invalidateAll: (options: {
        testKey: (key: string) => boolean;
    }) => Promise<void>;
    /**
     * Resets the entire Rest Hooks cache. All inflight requests will not resolve.
     * @see https://resthooks.io/docs/api/Controller#resetEntireStore
     */
    resetEntireStore: () => Promise<void>;
    /**
     * Stores response in cache for given Endpoint and args.
     * @see https://resthooks.io/docs/api/Controller#set
     */
    setResponse: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, any]) => Promise<void>;
    /**
     * Another name for setResponse
     * @see https://resthooks.io/docs/api/Controller#setResponse
     */
    receive: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, any]) => Promise<void>;
    /**
     * Stores the result of Endpoint and args as the error provided.
     * @see https://resthooks.io/docs/api/Controller#setError
     */
    setError: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, Error]) => Promise<void>;
    /**
     * Another name for setError
     * @see https://resthooks.io/docs/api/Controller#setError
     */
    receiveError: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, Error]) => Promise<void>;
    /**
     * Resolves an inflight fetch. `fetchedAt` should `fetch`'s `createdAt`
     * @see https://resthooks.io/docs/api/Controller#resolve
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
     * @see https://resthooks.io/docs/api/Controller#subscribe
     */
    subscribe: <E extends EndpointInterface<FetchFunction, Schema | undefined, false | undefined>>(endpoint: E, ...args: readonly [null] | readonly [...Parameters<E>]) => Promise<void>;
    /**
     * Marks completion of subscription to a given Endpoint.
     * @see https://resthooks.io/docs/api/Controller#unsubscribe
     */
    unsubscribe: <E extends EndpointInterface<FetchFunction, Schema | undefined, false | undefined>>(endpoint: E, ...args: readonly [null] | readonly [...Parameters<E>]) => Promise<void>;
    /*************** More ***************/
    /**
     * Gets a snapshot (https://resthooks.io/docs/api/Snapshot)
     * @see https://resthooks.io/docs/api/Controller#snapshot
     */
    snapshot: (state: State<unknown>, fetchedAt?: number) => SnapshotInterface;
    /**
     * Gets the error, if any, for a given endpoint. Returns undefined for no errors.
     * @see https://resthooks.io/docs/api/Controller#getError
     */
    getError: <E extends Pick<EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined>, "key">, Args extends readonly [null] | readonly [...Parameters<E["key"]>]>(endpoint: E, ...rest: [...Args, State<unknown>]) => ErrorTypes | undefined;
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://resthooks.io/docs/api/Controller#getResponse
     */
    getResponse: <E extends Pick<EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined>, "schema" | "key" | "invalidIfStale">, Args extends readonly [null] | readonly [...Parameters<E["key"]>]>(endpoint: E, ...rest: [...Args, State<unknown>]) => {
        data: DenormalizeNullable<E["schema"]>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
}

declare class Controller<D extends GenericDispatch = CompatibleDispatch> extends Controller$1<D> {
    /**
     * Fetches the endpoint with given args, updating the Rest Hooks cache with the response or error upon completion.
     * @see https://resthooks.io/docs/api/Controller#fetch
     */
    fetch: <E extends EndpointInterface<FetchFunction, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E> | undefined;
    }>(endpoint: E, ...args_0: Parameters<E>) => E["schema"] extends null | undefined ? ReturnType<E> : Promise<Denormalize<E["schema"]>>;
}

export { CompatibleDispatch, Controller, ErrorTypes, GenericDispatch };
