/// <reference types="react" />
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
    (input: any, schema: any): [any, boolean, boolean];
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
declare class WeakEntityMap<K extends object, V> {
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
type NormalizedNullableObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? NormalizeNullable$1<S[K]> : S[K];
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
type NormalizeNullable$1<S> = S extends EntityInterface ? string | undefined : S extends RecordClass ? NormalizedNullableObject<S['schema']> : S extends SchemaClass ? NormalizeReturnType<S['_normalizeNullable']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Normalize$1<F>[] | undefined : S extends {
    [K: string]: any;
} ? NormalizedNullableObject<S> : S;

/**
 * Build the result parameter to denormalize from schema alone.
 * Tries to compute the entity ids from params.
 */
declare function inferResults<S extends Schema>(schema: S, args: any[], indexes: NormalizedIndex, entities?: EntityTable): NormalizeNullable$1<S>;

declare const DELETED: unique symbol;

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
type NormalizeNullable<S> = Extract<S, EntityInterface> extends never ? Extract<S, EntityInterface[]> extends never ? NormalizeNullable$1<S> : NormalizeNullable$1<Extract<S, EntityInterface[]>> : NormalizeNullable$1<Extract<S, EntityInterface>>;

declare const RIC: (cb: (...args: any[]) => void, options: any) => void;

type ResultEntry<E extends EndpointInterface> = E['schema'] extends undefined | null ? ResolveType<E> : Normalize<E>;
type EndpointUpdateFunction<Source extends EndpointInterface, Updaters extends Record<string, any> = Record<string, any>> = (source: ResultEntry<Source>, ...args: Parameters<Source>) => {
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
declare const INVALIDATEALL_TYPE: "rest-hooks/invalidateall";
declare const GC_TYPE: "rest-hooks/gc";

declare const actionTypes_d_FETCH_TYPE: typeof FETCH_TYPE;
declare const actionTypes_d_RECEIVE_TYPE: typeof RECEIVE_TYPE;
declare const actionTypes_d_SET_TYPE: typeof SET_TYPE;
declare const actionTypes_d_OPTIMISTIC_TYPE: typeof OPTIMISTIC_TYPE;
declare const actionTypes_d_RESET_TYPE: typeof RESET_TYPE;
declare const actionTypes_d_SUBSCRIBE_TYPE: typeof SUBSCRIBE_TYPE;
declare const actionTypes_d_UNSUBSCRIBE_TYPE: typeof UNSUBSCRIBE_TYPE;
declare const actionTypes_d_INVALIDATE_TYPE: typeof INVALIDATE_TYPE;
declare const actionTypes_d_INVALIDATEALL_TYPE: typeof INVALIDATEALL_TYPE;
declare const actionTypes_d_GC_TYPE: typeof GC_TYPE;
declare namespace actionTypes_d {
  export {
    actionTypes_d_FETCH_TYPE as FETCH_TYPE,
    actionTypes_d_RECEIVE_TYPE as RECEIVE_TYPE,
    actionTypes_d_SET_TYPE as SET_TYPE,
    actionTypes_d_OPTIMISTIC_TYPE as OPTIMISTIC_TYPE,
    actionTypes_d_RESET_TYPE as RESET_TYPE,
    actionTypes_d_SUBSCRIBE_TYPE as SUBSCRIBE_TYPE,
    actionTypes_d_UNSUBSCRIBE_TYPE as UNSUBSCRIBE_TYPE,
    actionTypes_d_INVALIDATE_TYPE as INVALIDATE_TYPE,
    actionTypes_d_INVALIDATEALL_TYPE as INVALIDATEALL_TYPE,
    actionTypes_d_GC_TYPE as GC_TYPE,
  };
}

interface ReceiveMeta$2 {
    args: readonly any[];
    fetchedAt: number;
    date: number;
    expiresAt: number;
}
interface ReceiveActionSuccess<E extends EndpointInterface = EndpointInterface> {
    type: typeof RECEIVE_TYPE;
    endpoint: E;
    meta: ReceiveMeta$2;
    payload: ResolveType<E>;
    error?: false;
}
interface ReceiveActionError<E extends EndpointInterface = EndpointInterface> {
    type: typeof RECEIVE_TYPE;
    endpoint: E;
    meta: ReceiveMeta$2;
    payload: UnknownError;
    error: true;
}
type ReceiveAction$3<E extends EndpointInterface = EndpointInterface> = ReceiveActionSuccess<E> | ReceiveActionError<E>;
type SetAction<E extends EndpointInterface = EndpointInterface> = ReceiveAction$3<E>;
interface FetchMeta$2 {
    args: readonly any[];
    throttle: boolean;
    resolve: (value?: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void;
    promise: PromiseLike<any>;
    createdAt: number;
    nm?: boolean;
}
interface FetchAction$3<E extends EndpointInterface = EndpointInterface> {
    type: typeof FETCH_TYPE;
    endpoint: E;
    meta: FetchMeta$2;
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
interface SubscribeAction$3<E extends EndpointInterface = EndpointInterface> {
    type: typeof SUBSCRIBE_TYPE;
    endpoint: E;
    meta: {
        args: readonly any[];
    };
}
interface UnsubscribeAction$3<E extends EndpointInterface = EndpointInterface> {
    type: typeof UNSUBSCRIBE_TYPE;
    endpoint: E;
    meta: {
        args: readonly any[];
    };
}
interface InvalidateAllAction {
    type: typeof INVALIDATEALL_TYPE;
    testKey: (key: string) => boolean;
}
interface InvalidateAction$1 {
    type: typeof INVALIDATE_TYPE;
    meta: {
        key: string;
    };
}
interface ResetAction$3 {
    type: typeof RESET_TYPE;
    date: number;
}
interface GCAction$2 {
    type: typeof GC_TYPE;
    entities: [string, string][];
    results: string[];
}
type ActionTypes$2 = FetchAction$3 | OptimisticAction$2 | ReceiveAction$3 | SubscribeAction$3 | UnsubscribeAction$3 | InvalidateAction$1 | ResetAction$3 | GCAction$2;

type newActions_ReceiveActionSuccess<E extends EndpointInterface = EndpointInterface> = ReceiveActionSuccess<E>;
type newActions_ReceiveActionError<E extends EndpointInterface = EndpointInterface> = ReceiveActionError<E>;
type newActions_SetAction<E extends EndpointInterface = EndpointInterface> = SetAction<E>;
type newActions_InvalidateAllAction = InvalidateAllAction;
declare namespace newActions {
  export {
    ReceiveMeta$2 as ReceiveMeta,
    newActions_ReceiveActionSuccess as ReceiveActionSuccess,
    newActions_ReceiveActionError as ReceiveActionError,
    ReceiveAction$3 as ReceiveAction,
    newActions_SetAction as SetAction,
    FetchMeta$2 as FetchMeta,
    FetchAction$3 as FetchAction,
    OptimisticAction$2 as OptimisticAction,
    SubscribeAction$3 as SubscribeAction,
    UnsubscribeAction$3 as UnsubscribeAction,
    newActions_InvalidateAllAction as InvalidateAllAction,
    InvalidateAction$1 as InvalidateAction,
    ResetAction$3 as ResetAction,
    GCAction$2 as GCAction,
    ActionTypes$2 as ActionTypes,
  };
}

interface CompatibleFetchMeta extends FetchMeta$2 {
    key: string;
    schema?: Schema;
    type: 'mutate' | 'read';
    update?: (result: any, ...args: any) => Record<string, (...args: any) => any>;
    options?: EndpointExtraOptions;
    optimisticResponse?: {};
}
interface CompatibleFetchAction<E extends EndpointInterface = EndpointInterface> extends FetchAction$3<E> {
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
interface CompatibleSubscribeAction<E extends EndpointInterface = EndpointInterface> extends SubscribeAction$3<E> {
    meta: {
        args: readonly any[];
        schema: Schema | undefined;
        fetch: () => Promise<any>;
        key: string;
        options: EndpointExtraOptions | undefined;
    };
}
interface CompatibleUnsubscribeAction<E extends EndpointInterface = EndpointInterface> extends UnsubscribeAction$3<E> {
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
/** To change values on the server */
interface MutateShape<S extends Schema | undefined, Params extends Readonly<object> = Readonly<object>, Body extends Readonly<object | string> | void | unknown = Readonly<object | string> | undefined, Response extends object | string | number | boolean | null = any> extends FetchShape<S, Params, Body, Response> {
    readonly type: 'mutate';
    fetch(params: Params, body: Body): Promise<Response>;
}
/** Removes entities */
interface DeleteShape<S extends Schema | undefined, Params extends Readonly<object> = Readonly<object>, Response extends object | string | number | boolean | null = any> extends FetchShape<S, Params, undefined, Response> {
    readonly type: 'mutate';
    fetch(params: Params, ...args: any): Promise<Response>;
}
/** For retrieval requests */
interface ReadShape<S extends Schema | undefined, Params extends Readonly<object> = Readonly<object>, Response extends object | string | number | boolean | null = any> extends FetchShape<S, Params, undefined, Response> {
    readonly type: 'read';
    fetch(params: Params): Promise<Response>;
}

/** Sets a FetchShape's Param type.
 * Useful to constrain acceptable params (second arg) in hooks like useResource().
 *
 * @param [Shape] FetchShape to act upon
 * @param [Params] what to set the Params to
 */
type SetShapeParams<Shape extends FetchShape<any, any, any>, Params extends Readonly<object>> = {
    [K in keyof Shape]: Shape[K];
} & (Shape['fetch'] extends (first: any, ...rest: infer Args) => infer Return ? {
    fetch: (first: Params, ...rest: Args) => Return;
} : never);
/** Get the Params type for a given Shape */
type ParamsFromShape<S> = S extends {
    fetch: (first: infer A, ...rest: any) => any;
} ? A : S extends {
    getFetchKey: (first: infer A, ...rest: any) => any;
} ? A : never;
/** Get the Schema type for a given Shape */
type SchemaFromShape<F extends FetchShape<Schema | undefined, any, any>> = F['schema'];
/** Get the Body type for a given Shape */
type BodyFromShape<F extends FetchShape<any, any, any>> = Parameters<F['fetch']>[1];
type OptimisticUpdateParams<SourceSchema extends Schema | undefined, DestShape extends FetchShape<any, any, any>> = [
    DestShape,
    ParamsFromShape<DestShape>,
    UpdateFunction<SourceSchema, SchemaFromShape<DestShape>>
];
type ReturnFromShape<S extends FetchShape<any, any, any>> = ReturnType<S['fetch']> extends unknown ? Promise<Denormalize<S['schema']>> : ReturnType<S['fetch']>;

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
interface ResetAction$2 {
    type: typeof RESET_TYPE;
    date: number | Date;
}
interface FetchMeta$1<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any> {
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
interface FetchAction$2<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any> extends FSAWithPayloadAndMeta<typeof FETCH_TYPE, () => Promise<Payload>, FetchMeta$1<any, any>> {
    meta: FetchMeta$1<Payload, S>;
    endpoint?: undefined;
}
interface SubscribeAction$2 extends FSAWithMeta<typeof SUBSCRIBE_TYPE, undefined, any> {
    meta: {
        args?: readonly any[];
        schema: Schema | undefined;
        fetch: () => Promise<any>;
        key: string;
        options: EndpointExtraOptions | undefined;
    };
    endpoint?: undefined;
}
interface UnsubscribeAction$2 extends FSAWithMeta<typeof UNSUBSCRIBE_TYPE, undefined, any> {
    meta: {
        args?: readonly any[];
        key: string;
        options: EndpointExtraOptions | undefined;
    };
    endpoint?: undefined;
}

type RHDispatch<Actions = any> = (value: Actions) => Promise<void>;
interface MiddlewareAPI$1<R extends RestHooksReducer = RestHooksReducer> extends Controller<RHDispatch<CombinedActionTypes>> {
    controller: Controller<RHDispatch<CombinedActionTypes>>;
}
interface MiddlewareController<Actions = ActionTypes> extends Controller<RHDispatch<Actions>> {
    controller: Controller<RHDispatch<Actions>>;
}
type Middleware$2<Actions = any> = <A extends MiddlewareController<Actions>>(controller: A) => (next: A['dispatch']) => A['dispatch'];
type RestHooksReducer = React.Reducer<State<unknown>, ActionTypes$2>;
type Dispatch$1<R extends Reducer<any, any>> = (action: ReducerAction<R>) => Promise<void>;
type Reducer<S, A> = (prevState: S, action: A) => S;
type ReducerState<R extends Reducer<any, any>> = R extends Reducer<infer S, any> ? S : never;
type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<any, infer A> ? A : never;

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
    endpoint?: EndpointInterface;
}
interface SubscribeAction$1 extends FSAWithMeta<typeof SUBSCRIBE_TYPE, undefined, any> {
    endpoint?: EndpointInterface;
    meta: {
        args?: readonly any[];
        schema: Schema | undefined;
        fetch: () => Promise<any>;
        key: string;
        options: EndpointExtraOptions | undefined;
    };
}
interface UnsubscribeAction$1 extends FSAWithMeta<typeof UNSUBSCRIBE_TYPE, undefined, any> {
    endpoint?: EndpointInterface;
    meta: {
        args?: readonly any[];
        key: string;
        options: EndpointExtraOptions | undefined;
    };
}

interface GCAction$1 {
    type: typeof GC_TYPE;
    entities: [string, string][];
    results: string[];
}
type ActionTypes$1 = FetchAction$1 | OptimisticAction$1 | ReceiveAction$1 | SubscribeAction$1 | UnsubscribeAction$1 | InvalidateAction$1 | InvalidateAllAction | ResetAction$1 | GCAction$1;

type ReceiveTypes = typeof RECEIVE_TYPE;
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
type ResetAction = ResetAction$3 | ResetAction$2;
type GCAction = GCAction$2;
type FetchAction<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any> = CompatibleFetchAction | FetchAction$2<Payload, S>;
type ReceiveAction<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any> = CompatibleReceiveAction | ReceiveAction$2<Payload, S>;
type SubscribeAction = CompatibleSubscribeAction | SubscribeAction$2;
type UnsubscribeAction = CompatibleUnsubscribeAction | UnsubscribeAction$2;
type ResponseActions = ReceiveAction;
type OldActionTypes = ActionTypes$1;
type CombinedActionTypes = OptimisticAction | InvalidateAction | ResetAction | GCAction | FetchAction | ReceiveAction | SubscribeAction | UnsubscribeAction;
type ActionTypes = CombinedActionTypes;
interface Manager<Actions = CombinedActionTypes> {
    getMiddleware(): Middleware$2<Actions>;
    cleanup(): void;
    init?: (state: State<any>) => void;
}

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
declare class Controller<D extends GenericDispatch = CompatibleDispatch> {
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
     * Fetches the endpoint with given args, updating the Rest Hooks cache with the response or error upon completion.
     * @see https://resthooks.io/docs/api/Controller#fetch
     */
    fetch: <E extends EndpointInterface<FetchFunction<any, any>, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E, Record<string, any>> | undefined;
    }>(endpoint: E, ...args_0: Parameters<E>) => ReturnType<E>;
    /**
     * Forces refetching and suspense on useSuspense with the same Endpoint and parameters.
     * @see https://resthooks.io/docs/api/Controller#invalidate
     */
    invalidate: <E extends EndpointInterface<FetchFunction<any, any>, Schema | undefined, boolean | undefined>>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) => Promise<void>;
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
    setResponse: <E extends EndpointInterface<FetchFunction<any, any>, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E, Record<string, any>> | undefined;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, any]) => Promise<void>;
    /**
     * Another name for setResponse
     * @see https://resthooks.io/docs/api/Controller#setResponse
     */
    receive: <E extends EndpointInterface<FetchFunction<any, any>, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E, Record<string, any>> | undefined;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, any]) => Promise<void>;
    /**
     * Stores the result of Endpoint and args as the error provided.
     * @see https://resthooks.io/docs/api/Controller#setError
     */
    setError: <E extends EndpointInterface<FetchFunction<any, any>, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E, Record<string, any>> | undefined;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, Error]) => Promise<void>;
    /**
     * Another name for setError
     * @see https://resthooks.io/docs/api/Controller#setError
     */
    receiveError: <E extends EndpointInterface<FetchFunction<any, any>, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E, Record<string, any>> | undefined;
    }>(endpoint: E, ...rest: readonly [...Parameters<E>, Error]) => Promise<void>;
    /**
     * Resolves an inflight fetch. `fetchedAt` should `fetch`'s `createdAt`
     * @see https://resthooks.io/docs/api/Controller#resolve
     */
    resolve: <E extends EndpointInterface<FetchFunction<any, any>, Schema | undefined, boolean | undefined> & {
        update?: EndpointUpdateFunction<E, Record<string, any>> | undefined;
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
    subscribe: <E extends EndpointInterface<FetchFunction<any, any>, Schema | undefined, false | undefined>>(endpoint: E, ...args: readonly [null] | readonly [...Parameters<E>]) => Promise<void>;
    /**
     * Marks completion of subscription to a given Endpoint.
     * @see https://resthooks.io/docs/api/Controller#unsubscribe
     */
    unsubscribe: <E extends EndpointInterface<FetchFunction<any, any>, Schema | undefined, false | undefined>>(endpoint: E, ...args: readonly [null] | readonly [...Parameters<E>]) => Promise<void>;
    /*************** More ***************/
    snapshot: (state: State<unknown>, fetchedAt?: number) => SnapshotInterface;
    /**
     * Gets the error, if any, for a given endpoint. Returns undefined for no errors.
     * @see https://resthooks.io/docs/api/Controller#getError
     */
    getError: <E extends Pick<EndpointInterface<FetchFunction<any, any>, Schema | undefined, boolean | undefined>, "key">, Args extends readonly [null] | readonly [...Parameters<E["key"]>]>(endpoint: E, ...rest: [...Args, State<unknown>]) => ErrorTypes | undefined;
    /**
     * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
     * @see https://resthooks.io/docs/api/Controller#getResponse
     */
    getResponse: <E extends Pick<EndpointInterface<FetchFunction<any, any>, Schema | undefined, boolean | undefined>, "schema" | "key" | "invalidIfStale">, Args extends readonly [null] | readonly [...Parameters<E["key"]>]>(endpoint: E, ...rest: [...Args, State<unknown>]) => {
        data: DenormalizeNullable<E["schema"]>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
    };
    private getResults;
}

declare function createReducer(controller: Controller): ReducerType;
declare const initialState: State<unknown>;
type ReducerType = (state: State<unknown> | undefined, action: ActionTypes) => State<unknown>;

//# sourceMappingURL=internal.d.ts.map

declare const internal_d_inferResults: typeof inferResults;
declare const internal_d_DELETED: typeof DELETED;
declare const internal_d_RIC: typeof RIC;
declare const internal_d_initialState: typeof initialState;
declare namespace internal_d {
  export {
    internal_d_inferResults as inferResults,
    internal_d_DELETED as DELETED,
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
 * @see https://resthooks.io/docs/api/NetworkManager
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
    protected getState: () => State<unknown>;
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
    /** Called when middleware intercepts 'rest-hooks/fetch' action.
     *
     * Will then start a promise for a key and potentially start the network
     * fetch.
     *
     * Uses throttle only when instructed by action meta. This is valuable
     * for ensures mutation requests always go through.
     */
    protected handleFetch(action: FetchAction, dispatch: (action: any) => Promise<void>, controller: Controller): Promise<any>;
    /** Called when middleware intercepts a receive action.
     *
     * Will resolve the promise associated with receive key.
     */
    protected handleReceive(action: ReceiveAction): void;
    /** Attaches NetworkManager to store
     *
     * Intercepts 'rest-hooks/fetch' actions to start requests.
     *
     * Resolve/rejects a request when matching 'rest-hooks/receive' event
     * is seen.
     */
    getMiddleware(): Middleware$2<any>;
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

/**
 * @deprecated use createReducer instead
 */
declare const reducer: (state: State<unknown> | undefined, action: ActionTypes) => State<unknown>;
//# sourceMappingURL=reducerInstance.d.ts.map

declare function applyManager(managers: Manager[], controller: Controller): Middleware$1[];
interface MiddlewareAPI<R extends Reducer<any, any> = Reducer<any, any>> {
    getState: () => ReducerState<R>;
    dispatch: Dispatch$1<R>;
}
type Middleware$1 = <R extends Reducer<any, any>>({ dispatch, }: MiddlewareAPI<R>) => (next: Dispatch$1<R>) => Dispatch$1<R>;

/**
 * Requesting a fetch to begin
 */
declare function createFetch$1<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
}>(endpoint: E, { args }: {
    args: readonly [...Parameters<E>];
}): CompatibleFetchAction<E>;

declare function createReceive$1<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
}>(endpoint: E, options: {
    args: readonly [...Parameters<E>];
    response: Error;
    fetchedAt?: number;
    error: true;
}): CompatibleReceiveAction<E>;
declare function createReceive$1<E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
}>(endpoint: E, options: {
    args: readonly [...Parameters<E>];
    response: ResolveType<E>;
    fetchedAt?: number;
    error?: false;
}): CompatibleReceiveAction<E>;

interface Options$2<Shape extends FetchShape<Schema | undefined, Readonly<object>, Readonly<object | string> | void>> {
    params: ParamsFromShape<Shape>;
    body?: BodyFromShape<Shape>;
    throttle: boolean;
    updateParams?: OptimisticUpdateParams<SchemaFromShape<Shape>, FetchShape<Schema | undefined, any, any>>[] | undefined;
}
/** Requesting a fetch to begin
 *
 * @param fetchShape
 * @param param1 { params, body, throttle, updateParams }
 */
declare function createFetch<Shape extends FetchShape<Schema | undefined, Readonly<object>, Readonly<object | string> | void>>(fetchShape: Shape & {
    update?: (...args: any) => Record<string, (...args: any) => any>;
}, { params, body, throttle, updateParams }: Options$2<Shape>): FetchAction$2;

interface Options$1<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any> extends Pick<FetchAction$2<Payload, S>['meta'], 'schema' | 'key' | 'type' | 'updaters' | 'update' | 'args'> {
    dataExpiryLength: NonNullable<EndpointExtraOptions['dataExpiryLength']>;
    fetchedAt?: number;
}
/** Update state with data
 *
 * @param data
 * @param param1 { schema, key, type, updaters, dataExpiryLength }
 */
declare function createReceive<Payload extends object | string | number | null = object | string | number | null, S extends Schema | undefined = any>(data: Payload, { schema, key, args, updaters, fetchedAt, update, dataExpiryLength, }: Options$1<Payload, S>): ReceiveAction$2<Payload, S>;

interface Options<S extends Schema | undefined = any> extends Pick<FetchAction$2<any, S>['meta'], 'schema' | 'key' | 'options'> {
    errorExpiryLength?: NonNullable<EndpointExtraOptions['errorExpiryLength']>;
    fetchedAt?: number;
}
declare function createReceiveError<S extends Schema | undefined = any>(error: Error, { schema, key, options, errorExpiryLength, fetchedAt, }: Options<S>): ReceiveAction$2;

//# sourceMappingURL=index.d.ts.map

declare const index_d_createFetch: typeof createFetch;
declare const index_d_createReceive: typeof createReceive;
declare const index_d_createReceiveError: typeof createReceiveError;
declare namespace index_d {
  export {
    index_d_createFetch as createFetch,
    index_d_createReceive as createReceive,
    index_d_createReceiveError as createReceiveError,
  };
}

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

/** Properties sent to Subscription constructor */
interface SubscriptionInit {
    schema?: Schema | undefined;
    fetch: () => Promise<any>;
    key: string;
    getState: () => State<unknown>;
    frequency?: number | undefined;
}
/** Interface handling a single resource subscription */
interface Subscription {
    add(frequency?: number): void;
    remove(frequency?: number): boolean;
    cleanup(): void;
}
/** The static class that constructs Subscription */
interface SubscriptionConstructable {
    new (init: SubscriptionInit, dispatch: Dispatch$1<any>): Subscription;
}
/** Handles subscription actions -> fetch or receive actions
 *
 * Constructor takes a SubscriptionConstructable class to control how
 * subscriptions are handled. (e.g., polling, websockets)
 *
 * @see https://resthooks.io/docs/api/SubscriptionManager
 */
declare class SubscriptionManager<S extends SubscriptionConstructable> implements Manager {
    protected subscriptions: {
        [key: string]: InstanceType<S>;
    };
    protected readonly Subscription: S;
    protected middleware: Middleware$2;
    constructor(Subscription: S);
    /** Ensures all subscriptions are cleaned up. */
    cleanup(): void;
    /** Called when middleware intercepts 'rest-hooks/subscribe' action.
     *
     */
    protected handleSubscribe(action: SubscribeAction, dispatch: (action: any) => Promise<void>, getState: () => State<unknown>): void;
    /** Called when middleware intercepts 'rest-hooks/unsubscribe' action.
     *
     */
    protected handleUnsubscribe(action: UnsubscribeAction, dispatch: (action: any) => Promise<void>): void;
    /** Attaches Manager to store
     *
     * Intercepts 'rest-hooks/subscribe'/'rest-hooks/unsubscribe' to register resources that
     * need to be kept up to date.
     *
     * Will possibly dispatch 'rest-hooks/fetch' or 'rest-hooks/receive' to keep resources fresh
     *
     */
    getMiddleware(): Middleware$2<any>;
}

/**
 * PollingSubscription keeps a given resource updated by
 * dispatching a fetch at a rate equal to the minimum update
 * interval requested.
 *
 * @see https://resthooks.io/docs/api/PollingSubscription
 */
declare class PollingSubscription implements Subscription {
    protected readonly schema: Schema | undefined;
    protected readonly fetch: () => Promise<any>;
    protected readonly key: string;
    protected frequency: number;
    protected frequencyHistogram: Map<number, number>;
    protected dispatch: Dispatch$1<any>;
    protected getState: () => State<unknown>;
    protected intervalId?: ReturnType<typeof setInterval>;
    protected lastIntervalId?: ReturnType<typeof setInterval>;
    protected startId?: ReturnType<typeof setTimeout>;
    private connectionListener;
    constructor({ key, schema, fetch, frequency, getState }: SubscriptionInit, dispatch: Dispatch$1<any>, connectionListener?: ConnectionListener);
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
 * @see https://resthooks.io/docs/api/LogoutManager
 */
declare class LogoutManager implements Manager<CombinedActionTypes> {
    protected middleware: Middleware;
    constructor({ handleLogout, shouldLogout }?: Props);
    cleanup(): void;
    getMiddleware(): Middleware;
    protected shouldLogout(error: UnknownError): boolean;
    handleLogout(controller: Controller<Dispatch>): void;
}
type Dispatch = (value: CombinedActionTypes) => Promise<void>;
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
 * @see https://resthooks.io/docs/api/DevToolsManager
 */
declare class DevToolsManager implements Manager {
    protected middleware: Middleware;
    protected devTools: undefined | any;
    constructor(config?: DevToolsConfig, skipLogging?: (action: ActionTypes) => boolean);
    /** Called when initial state is ready */
    init(state: State<any>): void;
    /** Ensures all subscriptions are cleaned up. */
    cleanup(): void;
    /** Attaches Manager to store
     *
     */
    getMiddleware(): Middleware;
}

export { AbstractInstanceType, ActionTypes, BodyFromShape, CombinedActionTypes, ConnectionListener, Controller, DefaultConnectionListener, DeleteShape, Denormalize, DenormalizeCache, DenormalizeNullable, DevToolsConfig, DevToolsManager, Dispatch$1 as Dispatch, EndpointExtraOptions, EndpointInterface, EndpointUpdateFunction, EntityInterface, ErrorTypes, ExpiryStatus, FetchAction, FetchFunction, FetchShape, GCAction, InvalidateAction, LogoutManager, Manager, Middleware$2 as Middleware, MiddlewareAPI$1 as MiddlewareAPI, MutateShape, NetworkError, NetworkManager, Normalize, NormalizeNullable, OldActionTypes, OptimisticAction, PK, ParamsFromShape, PollingSubscription, ReadShape, ReceiveAction, ReceiveTypes, ResetAction, ResetError, ResolveType, ResponseActions, ResultEntry, ReturnFromShape, Schema, SetAction, SetShapeParams, State, SubscribeAction, SubscriptionManager, UnknownError, UnsubscribeAction, UpdateFunction, internal_d as __INTERNAL__, actionTypes_d as actionTypes, applyManager, createFetch$1 as createFetch, createReceive$1 as createReceive, createReducer, initialState, index_d as legacyActions, newActions, reducer };
