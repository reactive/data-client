/// <reference types="react" />
import * as React$1 from 'react';
import React__default from 'react';
import {
  ErrorFluxStandardActionWithPayloadAndMeta,
  FSA,
  FSAWithPayloadAndMeta,
  FSAWithMeta,
} from 'flux-standard-action';

declare type Schema =
  | null
  | string
  | {
      [K: string]: any;
    }
  | Schema[]
  | SchemaSimple
  | Serializable;
declare type Serializable<
  T extends {
    toJSON(): string;
  } = {
    toJSON(): string;
  },
> = {
  prototype: T;
};
interface SchemaSimple<T = any> {
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
  ): any;
  denormalize(
    input: {},
    unvisit: UnvisitFunction,
  ): [denormalized: T, found: boolean, suspend: boolean];
  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
    entities: EntityTable,
  ): any;
}
interface SchemaClass<T = any, N = T | undefined> extends SchemaSimple<T> {
  _normalizeNullable(): any;
  _denormalizeNullable(): [N, boolean, boolean];
}
interface EntityInterface<T = any> extends SchemaSimple {
  pk(params: any, parent?: any, key?: string): string | undefined;
  readonly key: string;
  merge(existing: any, incoming: any): any;
  expiresAt?(meta: any, input: any): number;
  useIncoming?(
    existingMeta: any,
    incomingMeta: any,
    existing: any,
    incoming: any,
  ): boolean;
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
  [entityKey: string]:
    | {
        [pk: string]: unknown;
      }
    | undefined;
}

/** Link in a chain */
declare class Link<K extends object, V> {
  children: WeakMap<K, Link<K, V>>;
  value?: V;
}
/** Maps from a list of objects (referentially) to any value
 *
 * If *any* members of the list get claned up, so does that key/value pair get removed.
 */
declare class WeakListMap<K extends object, V> {
  readonly first: WeakMap<K, Link<K, V>>;
  delete(key: K[]): boolean;
  get(key: K[]): V | undefined;
  has(key: K[]): boolean;
  set(key: K[], value: V): WeakListMap<K, V>;
  protected traverse(key: K[]): Link<K, V> | undefined;
}

declare type AbstractInstanceType<T> = T extends {
  prototype: infer U;
}
  ? U
  : never;
declare type DenormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Denormalize$1<S[K]> : S[K];
};
declare type DenormalizeNullableObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? DenormalizeNullable$1<S[K]> : S[K];
};
declare type NormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Normalize$1<S[K]> : S[K];
};
declare type NormalizedNullableObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? NormalizeNullable<S[K]> : S[K];
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
      [pk: string]: WeakListMap<object, EntityInterface>;
    };
  };
  results: {
    [key: string]: WeakListMap<object, any>;
  };
}
declare type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> =
  keyof S['schema'] extends never
    ? S['prototype']
    : string extends keyof S['schema']
    ? S['prototype']
    : S['prototype'];
declare type DenormalizeReturnType<T> = T extends (
  input: any,
  unvisit: any,
) => [infer R, any, any]
  ? R
  : never;
declare type NormalizeReturnType<T> = T extends (...args: any) => infer R
  ? R
  : never;
declare type Denormalize$1<S> = S extends EntityInterface<infer U>
  ? U
  : S extends RecordClass
  ? AbstractInstanceType<S>
  : S extends SchemaClass
  ? DenormalizeReturnType<S['denormalize']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Denormalize$1<F>[]
  : S extends {
      [K: string]: any;
    }
  ? DenormalizeObject<S>
  : S;
declare type DenormalizeNullable$1<S> = S extends EntityInterface<any>
  ? DenormalizeNullableNestedSchema<S> | undefined
  : S extends RecordClass
  ? DenormalizeNullableNestedSchema<S>
  : S extends SchemaClass
  ? DenormalizeReturnType<S['_denormalizeNullable']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Denormalize$1<F>[] | undefined
  : S extends {
      [K: string]: any;
    }
  ? DenormalizeNullableObject<S>
  : S;
declare type Normalize$1<S> = S extends EntityInterface
  ? string
  : S extends RecordClass
  ? NormalizeObject<S['schema']>
  : S extends SchemaClass
  ? NormalizeReturnType<S['normalize']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Normalize$1<F>[]
  : S extends {
      [K: string]: any;
    }
  ? NormalizeObject<S>
  : S;
declare type NormalizeNullable<S> = S extends EntityInterface
  ? string | undefined
  : S extends RecordClass
  ? NormalizedNullableObject<S['schema']>
  : S extends SchemaClass
  ? NormalizeReturnType<S['_normalizeNullable']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Normalize$1<F>[] | undefined
  : S extends {
      [K: string]: any;
    }
  ? NormalizedNullableObject<S>
  : S;

/**
 * Build the result parameter to denormalize from schema alone.
 * Tries to compute the entity ids from params.
 */
declare function inferResults<S extends Schema>(
  schema: S,
  args: any[],
  indexes: NormalizedIndex,
  entities?: EntityTable,
): NormalizeNullable<S>;

declare const DELETED: unique symbol;

interface NetworkError extends Error {
  status: number;
  response?: Response;
}
interface UnknownError extends Error {
  status?: unknown;
  response?: unknown;
}
declare type ErrorTypes$1 = NetworkError | UnknownError;

/** What the function's promise resolves to */
declare type ResolveType<E extends (...args: any) => any> =
  ReturnType<E> extends Promise<infer R> ? R : never;
/** Fallback to schema if fetch function isn't defined */
declare type InferReturn<
  F extends FetchFunction,
  S extends Schema | undefined,
> = S extends undefined
  ? ReturnType<F>
  : ReturnType<F> extends unknown
  ? Promise<Denormalize$1<S>>
  : ReturnType<F>;

declare const enum ExpiryStatus {
  Invalid = 1,
  InvalidIfStale = 2,
  Valid = 3,
}
declare type ExpiryStatusInterface = 1 | 2 | 3;

interface SnapshotInterface {
  getResponse: <
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
    Args extends readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...args: Args
  ) => {
    data: DenormalizeNullable$1<E['schema']>;
    expiryStatus: ExpiryStatusInterface;
    expiresAt: number;
  };
  getError: <
    E extends Pick<EndpointInterface, 'key'>,
    Args extends readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...args: Args
  ) => ErrorTypes$1 | undefined;
  readonly fetchedAt: number;
}

/** Defines a networking endpoint */
interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointExtraOptions<F> {
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
  getOptimisticResponse?(
    snap: SnapshotInterface,
    ...args: Parameters<F>
  ): ResolveType<F>;
  /** Determines whether to throw or fallback to */
  errorPolicy?(error: any): 'hard' | 'soft' | undefined;
  /** User-land extra data to send */
  readonly extra?: any;
}
declare type UpdateFunction<
  SourceSchema extends Schema | undefined,
  DestSchema extends Schema,
> = (
  sourceResults: Normalize$1<SourceSchema>,
  destResults: Normalize$1<DestSchema> | undefined,
) => Normalize$1<DestSchema>;

declare type FetchFunction<A extends readonly any[] = any, R = any> = (
  ...args: A
) => Promise<R>;

/** This file exists to keep compatibility with SchemaDetail, and SchemaList type hacks
 * Support can be dropped once @rest-hooks/rest@5 support is dropped
 */

declare type Denormalize<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? Denormalize$1<S>
    : Denormalize$1<Extract<S, EntityInterface[]>>
  : Denormalize$1<Extract<S, EntityInterface>>;
declare type DenormalizeNullable<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? DenormalizeNullable$1<S>
    : DenormalizeNullable$1<Extract<S, EntityInterface[]>>
  : DenormalizeNullable$1<Extract<S, EntityInterface>>;
declare type Normalize<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? Normalize$1<S>
    : Normalize$1<Extract<S, EntityInterface[]>>
  : Normalize$1<Extract<S, EntityInterface>>;

declare const RIC: (cb: (...args: any[]) => void, options: any) => void;

declare const _default: React__default.NamedExoticComponent<{
  children: React__default.ReactNode;
}>;
//# sourceMappingURL=BackupBoundary.d.ts.map

//# sourceMappingURL=internal.d.ts.map

declare const internal_d_inferResults: typeof inferResults;
declare const internal_d_DELETED: typeof DELETED;
declare const internal_d_RIC: typeof RIC;
declare namespace internal_d {
  export {
    internal_d_inferResults as inferResults,
    internal_d_DELETED as DELETED,
    internal_d_RIC as RIC,
    _default as BackupBoundary,
  };
}

interface MiddlewareAPI$1<
  R extends React__default.Reducer<any, any> = React__default.Reducer<any, any>,
> {
  getState: () => React__default.ReducerState<R>;
  dispatch: Dispatch<R>;
}
declare type Dispatch<R extends React__default.Reducer<any, any>> = (
  action: React__default.ReducerAction<R>,
) => Promise<void>;
declare type Middleware$1 = <R extends React__default.Reducer<any, any>>({
  dispatch,
}: MiddlewareAPI$1<R>) => (next: Dispatch<R>) => Dispatch<R>;

/** Turns a dispatch function into one that resolves once its been commited */
declare function usePromisifiedDispatch<
  R extends React__default.Reducer<any, any>,
>(
  dispatch: React__default.Dispatch<React__default.ReducerAction<R>>,
  state: React__default.ReducerState<R>,
): (action: React__default.ReducerAction<R>) => Promise<void>;

declare type ErrorableFSAWithPayloadAndMeta<
  Type extends string = string,
  Payload = undefined,
  Meta = undefined,
  CustomError extends Error = Error,
> =
  | ErrorFluxStandardActionWithPayloadAndMeta<Type, CustomError, Meta>
  | NoErrorFluxStandardActionWithPayloadAndMeta<Type, Payload, Meta>;
interface NoErrorFluxStandardAction<
  Type extends string = string,
  Payload = undefined,
  Meta = undefined,
> extends FSA<Type, Payload, Meta> {
  error?: false;
}
/**
 * A Flux Standard action with a required payload property.
 */
interface NoErrorFluxStandardActionWithPayload<
  Type extends string = string,
  Payload = undefined,
  Meta = undefined,
> extends NoErrorFluxStandardAction<Type, Payload, Meta> {
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
interface NoErrorFluxStandardActionWithMeta<
  Type extends string = string,
  Payload = undefined,
  Meta = undefined,
> extends NoErrorFluxStandardAction<Type, Payload, Meta> {
  /**
   * The required `meta` property MAY be any type of value.
   * It is intended for any extra information that is not part of the payload.
   */
  meta: Meta;
}
/**
 * A Flux Standard action with required payload and metadata properties.
 */
declare type NoErrorFluxStandardActionWithPayloadAndMeta<
  Type extends string = string,
  Payload = undefined,
  Meta = undefined,
> = NoErrorFluxStandardActionWithPayload<Type, Payload, Meta> &
  NoErrorFluxStandardActionWithMeta<Type, Payload, Meta>;

/** Defines the shape of a network request */
interface FetchShape<
  S extends Schema | undefined,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void | unknown =
    | Readonly<object | string>
    | undefined,
  Response = any,
> {
  readonly type: 'read' | 'mutate' | 'delete';
  fetch(params: Params, body?: Body): Promise<Response>;
  getFetchKey(params: Params): string;
  readonly schema: S;
  readonly options?: EndpointExtraOptions;
}
/** To change values on the server */
interface MutateShape<
  S extends Schema | undefined,
  Params extends Readonly<object> = Readonly<object>,
  Body extends Readonly<object | string> | void | unknown =
    | Readonly<object | string>
    | undefined,
  Response extends object | string | number | boolean | null = any,
> extends FetchShape<S, Params, Body, Response> {
  readonly type: 'mutate';
  fetch(params: Params, body: Body): Promise<Response>;
}
/** Removes entities */
interface DeleteShape<
  S extends Schema | undefined,
  Params extends Readonly<object> = Readonly<object>,
  Response extends object | string | number | boolean | null = any,
> extends FetchShape<S, Params, undefined, Response> {
  readonly type: 'mutate';
  fetch(params: Params, ...args: any): Promise<Response>;
}
/** For retrieval requests */
interface ReadShape<
  S extends Schema | undefined,
  Params extends Readonly<object> = Readonly<object>,
  Response extends object | string | number | boolean | null = any,
> extends FetchShape<S, Params, undefined, Response> {
  readonly type: 'read';
  fetch(params: Params): Promise<Response>;
}

/** Sets a FetchShape's Param type.
 * Useful to constrain acceptable params (second arg) in hooks like useResource().
 *
 * @param [Shape] FetchShape to act upon
 * @param [Params] what to set the Params to
 */
declare type SetShapeParams<
  Shape extends FetchShape<any, any, any>,
  Params extends Readonly<object>,
> = {
  [K in keyof Shape]: Shape[K];
} & (Shape['fetch'] extends (first: any, ...rest: infer Args) => infer Return
  ? {
      fetch: (first: Params, ...rest: Args) => Return;
    }
  : never);
/** Get the Params type for a given Shape */
declare type ParamsFromShape<S> = S extends {
  fetch: (first: infer A, ...rest: any) => any;
}
  ? A
  : S extends {
      getFetchKey: (first: infer A, ...rest: any) => any;
    }
  ? A
  : never;
/** Get the Schema type for a given Shape */
declare type SchemaFromShape<
  F extends FetchShape<Schema | undefined, any, any>,
> = F['schema'];
/** Get the Body type for a given Shape */
declare type BodyFromShape<F extends FetchShape<any, any, any>> = Parameters<
  F['fetch']
>[1];
declare type OptimisticUpdateParams<
  SourceSchema extends Schema | undefined,
  DestShape extends FetchShape<any, any, any>,
> = [
  DestShape,
  ParamsFromShape<DestShape>,
  UpdateFunction<SourceSchema, SchemaFromShape<DestShape>>,
];
declare type ReturnFromShape<S extends FetchShape<any, any, any>> = ReturnType<
  S['fetch']
> extends unknown
  ? Promise<Denormalize<S['schema']>>
  : ReturnType<S['fetch']>;

declare const FETCH_TYPE: 'rest-hooks/fetch';
declare const RECEIVE_TYPE: 'rest-hooks/receive';
declare const OPTIMISTIC_TYPE: 'rest-hooks/optimistic';
declare const RESET_TYPE: 'rest-hooks/reset';
declare const SUBSCRIBE_TYPE: 'rest-hooks/subscribe';
declare const UNSUBSCRIBE_TYPE: 'rest-hook/unsubscribe';
declare const INVALIDATE_TYPE: 'rest-hooks/invalidate';
declare const GC_TYPE: 'rest-hooks/gc';

declare const actionTypes_d_FETCH_TYPE: typeof FETCH_TYPE;
declare const actionTypes_d_RECEIVE_TYPE: typeof RECEIVE_TYPE;
declare const actionTypes_d_OPTIMISTIC_TYPE: typeof OPTIMISTIC_TYPE;
declare const actionTypes_d_RESET_TYPE: typeof RESET_TYPE;
declare const actionTypes_d_SUBSCRIBE_TYPE: typeof SUBSCRIBE_TYPE;
declare const actionTypes_d_UNSUBSCRIBE_TYPE: typeof UNSUBSCRIBE_TYPE;
declare const actionTypes_d_INVALIDATE_TYPE: typeof INVALIDATE_TYPE;
declare const actionTypes_d_GC_TYPE: typeof GC_TYPE;
declare namespace actionTypes_d {
  export {
    actionTypes_d_FETCH_TYPE as FETCH_TYPE,
    actionTypes_d_RECEIVE_TYPE as RECEIVE_TYPE,
    actionTypes_d_OPTIMISTIC_TYPE as OPTIMISTIC_TYPE,
    actionTypes_d_RESET_TYPE as RESET_TYPE,
    actionTypes_d_SUBSCRIBE_TYPE as SUBSCRIBE_TYPE,
    actionTypes_d_UNSUBSCRIBE_TYPE as UNSUBSCRIBE_TYPE,
    actionTypes_d_INVALIDATE_TYPE as INVALIDATE_TYPE,
    actionTypes_d_GC_TYPE as GC_TYPE,
  };
}

declare type ResultEntry<E extends EndpointInterface> =
  E['schema'] extends undefined ? ResolveType<E> : Normalize<E>;
declare type EndpointUpdateFunction<
  Source extends EndpointInterface,
  Updaters extends Record<string, any> = Record<string, any>,
> = (
  source: ResultEntry<Source>,
  ...args: Parameters<Source>
) => {
  [K in keyof Updaters]: (result: Updaters[K]) => Updaters[K];
};

declare type RHDispatch = (value: ActionTypes) => Promise<void>;
interface ConstructorProps {
  dispatch?: RHDispatch;
  globalCache?: DenormalizeCache;
}
/**
 * Imperative control of Rest Hooks store
 * @see https://resthooks.io/docs/api/Controller
 */
declare class Controller {
  readonly dispatch: RHDispatch;
  readonly globalCache: DenormalizeCache;
  constructor({ dispatch, globalCache }?: ConstructorProps);
  /*************** Action Dispatchers ***************/
  /**
   * Fetches the endpoint with given args, updating the Rest Hooks cache with the response or error upon completion.
   * @see https://resthooks.io/docs/api/Controller#fetch
   */
  fetch: <
    E extends EndpointInterface<
      FetchFunction<any, any>,
      Schema | undefined,
      true | undefined
    > & {
      update?: EndpointUpdateFunction<E, Record<string, any>> | undefined;
    },
  >(
    endpoint: E,
    ...args_0: Parameters<E>
  ) => ReturnType<E>;

  /**
   * Forces refetching and suspense on useResource with the same Endpoint and parameters.
   * @see https://resthooks.io/docs/api/Controller#invalidate
   */
  invalidate: <
    E extends EndpointInterface<
      FetchFunction<any, any>,
      Schema | undefined,
      true | undefined
    >,
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ) => Promise<void>;

  /**
   * Resets the entire Rest Hooks cache. All inflight requests will not resolve.
   * @see https://resthooks.io/docs/api/Controller#resetEntireStore
   */
  resetEntireStore: () => Promise<void>;
  /**
   * Stores response in cache for given Endpoint and args.
   * @see https://resthooks.io/docs/api/Controller#receive
   */
  receive: <
    E extends EndpointInterface<
      FetchFunction<any, any>,
      Schema | undefined,
      true | undefined
    > & {
      update?: EndpointUpdateFunction<E, Record<string, any>> | undefined;
    },
  >(
    endpoint: E,
    ...rest: readonly [...Parameters<E>, any]
  ) => Promise<void>;

  /**
   * Stores the result of Endpoint and args as the error provided.
   * @see https://resthooks.io/docs/api/Controller#receiveError
   */
  receiveError: <
    E extends EndpointInterface<
      FetchFunction<any, any>,
      Schema | undefined,
      true | undefined
    > & {
      update?: EndpointUpdateFunction<E, Record<string, any>> | undefined;
    },
  >(
    endpoint: E,
    ...rest: readonly [...Parameters<E>, Error]
  ) => Promise<void>;

  /**
   * Resolves an inflight fetch. `fetchedAt` should `fetch`'s `createdAt`
   * @see https://resthooks.io/docs/api/Controller#resolve
   */
  resolve: <
    E extends EndpointInterface<
      FetchFunction<any, any>,
      Schema | undefined,
      true | undefined
    > & {
      update?: EndpointUpdateFunction<E, Record<string, any>> | undefined;
    },
  >(
    endpoint: E,
    meta:
      | {
          args: readonly [...Parameters<E>];
          response: Error;
          fetchedAt: number;
          error: true;
        }
      | {
          args: readonly [...Parameters<E>];
          response: any;
          fetchedAt: number;
          error?: false | undefined;
        },
  ) => Promise<void>;

  /**
   * Marks a new subscription to a given Endpoint.
   * @see https://resthooks.io/docs/api/Controller#subscribe
   */
  subscribe: <
    E extends EndpointInterface<
      FetchFunction<any, any>,
      Schema | undefined,
      undefined
    >,
  >(
    endpoint: E,
    ...args: readonly [null] | readonly [...Parameters<E>]
  ) => Promise<void>;

  /**
   * Marks completion of subscription to a given Endpoint.
   * @see https://resthooks.io/docs/api/Controller#unsubscribe
   */
  unsubscribe: <
    E extends EndpointInterface<
      FetchFunction<any, any>,
      Schema | undefined,
      undefined
    >,
  >(
    endpoint: E,
    ...args: readonly [null] | readonly [...Parameters<E>]
  ) => Promise<void>;

  /*************** More ***************/
  /**
   * Gets the latest state snapshot that is fully committed.
   *
   * This can be useful for imperative use-cases like event handlers.
   * This should *not* be used to render; instead useSuspense() or useCache()
   * @see https://resthooks.io/docs/api/Controller#getState
   */
  getState: () => State<unknown>;
  snapshot: (state: State<unknown>, fetchedAt?: number) => SnapshotInterface;
  /**
   * Gets the error, if any, for a given endpoint. Returns undefined for no errors.
   * @see https://resthooks.io/docs/api/Controller#getError
   */
  getError: <
    E extends Pick<
      EndpointInterface<
        FetchFunction<any, any>,
        Schema | undefined,
        true | undefined
      >,
      'key'
    >,
    Args extends readonly [null] | readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...rest: [...Args, State<unknown>]
  ) => ErrorTypes$1 | undefined;

  /**
   * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
   * @see https://resthooks.io/docs/api/Controller#getResponse
   */
  getResponse: <
    E extends Pick<
      EndpointInterface<
        FetchFunction<any, any>,
        Schema | undefined,
        true | undefined
      >,
      'schema' | 'key' | 'invalidIfStale'
    >,
    Args extends readonly [null] | readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...rest: [...Args, State<unknown>]
  ) => {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  };

  private getResults;
}

declare type ReceiveTypes = typeof RECEIVE_TYPE;
declare type PK = string;
interface State<T> {
  readonly entities: {
    readonly [entityKey: string]:
      | {
          readonly [pk: string]: T;
        }
      | undefined;
  };
  readonly indexes: NormalizedIndex;
  readonly results: {
    readonly [key: string]: unknown | PK[] | PK | undefined;
  };
  readonly meta: {
    readonly [key: string]: {
      readonly date: number;
      readonly error?: ErrorTypes$1;
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
  readonly optimistic: (ReceiveAction | OptimisticAction)[];
  readonly lastReset: Date | number;
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
declare type ReceiveAction<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any,
> = ErrorableFSAWithPayloadAndMeta<
  typeof RECEIVE_TYPE,
  Payload,
  ReceiveMeta<S>
> & {
  endpoint?: EndpointInterface;
};
declare type OptimisticAction<
  E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
  } = EndpointInterface & {
    update?: EndpointUpdateFunction<EndpointInterface>;
  },
> = {
  type: typeof OPTIMISTIC_TYPE;
  meta: {
    schema: E['schema'];
    key: string;
    args: readonly any[];
    update?: (
      result: any,
      ...args: any
    ) => Record<string, (...args: any) => any>;
    fetchedAt: number;
    date: number;
    expiresAt: number;
    errorPolicy?: (error: any) => 'hard' | 'soft' | undefined;
  };
  endpoint: E;
  error?: undefined;
};
interface ResetAction {
  type: typeof RESET_TYPE;
  date: number | Date;
}
interface FetchMeta<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any,
> {
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
interface FetchAction<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any,
> extends FSAWithPayloadAndMeta<
    typeof FETCH_TYPE,
    () => Promise<Payload>,
    FetchMeta<any, any>
  > {
  meta: FetchMeta<Payload, S>;
  endpoint?: EndpointInterface;
}
interface SubscribeAction
  extends FSAWithMeta<typeof SUBSCRIBE_TYPE, undefined, any> {
  endpoint?: EndpointInterface;
  meta: {
    args?: readonly any[];
    schema: Schema | undefined;
    fetch: () => Promise<any>;
    key: string;
    options: EndpointExtraOptions | undefined;
  };
}
interface UnsubscribeAction
  extends FSAWithMeta<typeof UNSUBSCRIBE_TYPE, undefined, any> {
  endpoint?: EndpointInterface;
  meta: {
    args?: readonly any[];
    key: string;
    options: EndpointExtraOptions | undefined;
  };
}
interface InvalidateAction
  extends FSAWithMeta<typeof INVALIDATE_TYPE, undefined, any> {
  meta: {
    key: string;
  };
}
interface GCAction {
  type: typeof GC_TYPE;
  entities: [string, string][];
  results: string[];
}
declare type ResponseActions = ReceiveAction;
declare type ActionTypes =
  | FetchAction
  | OptimisticAction
  | ReceiveAction
  | SubscribeAction
  | UnsubscribeAction
  | InvalidateAction
  | ResetAction
  | GCAction;
interface Manager {
  getMiddleware(): Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}
declare type Middleware = <R extends React.Reducer<any, any>>(
  options: MiddlewareAPI<R>,
) => (next: Dispatch<R>) => Dispatch<R>;
interface MiddlewareAPI<
  R extends React.Reducer<any, any> = React.Reducer<any, any>,
> {
  getState: () => React.ReducerState<R>;
  dispatch: Dispatch<R>;
  controller: Controller;
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

  readonly dataExpiryLength: number;
  readonly errorExpiryLength: number;
  protected middleware: Middleware;
  protected getState: () => State<unknown>;
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
  protected handleFetch(
    action: FetchAction,
    dispatch: Dispatch<any>,
    controller: Controller,
  ): Promise<string | number | void | object | null>;

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
  getMiddleware<T extends NetworkManager>(this: T): Middleware;
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
  protected throttle(key: string, fetch: () => Promise<any>): Promise<any>;
}

declare const initialState: State<unknown>;
declare function createReducer(
  controller: Controller,
): (state: State<unknown> | undefined, action: ActionTypes) => State<unknown>;

/**
 * @deprecated use createReducer instead
 */
declare const reducer: (
  state: State<unknown> | undefined,
  action: ActionTypes,
) => State<unknown>;
//# sourceMappingURL=reducerInstance.d.ts.map

declare function applyManager(
  managers: Manager[],
  controller: Controller,
): Middleware$1[];

/**
 * @deprecated use https://resthooks.io/docs/api/Controller#getResponse directly instead
 *
 * Selects the denormalized form from `state` cache.
 *
 * If `result` is not found, will attempt to generate it naturally
 * using params and schema. This increases cache hit rate for many
 * detail shapes.
 *
 * @returns [denormalizedValue, ready]
 */
declare function useDenormalized<
  Shape extends Pick<
    ReadShape<Schema | undefined, any>,
    'getFetchKey' | 'schema' | 'options'
  >,
>(
  shape: Shape,
  params: ParamsFromShape<Shape> | null,
  state: State<any>,
  /** @deprecated */
  denormalizeCache?: any,
): {
  data: DenormalizeNullable<Shape['schema']>;
  expiryStatus: ExpiryStatus;
  expiresAt: number;
};

interface ProviderProps {
  children: React__default.ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
  Controller: typeof Controller;
}
/**
 * Controller managing state of the cache and coordinating network requests.
 * @see https://resthooks.io/docs/api/CacheProvider
 */
declare function CacheProvider({
  children,
  managers,
  initialState,
  Controller,
}: ProviderProps): JSX.Element;
declare namespace CacheProvider {
  var defaultProps: {
    managers: Manager[];
    initialState: State<unknown>;
    Controller: typeof Controller;
  };
}
//# sourceMappingURL=CacheProvider.d.ts.map

/**
 * Build an imperative dispatcher to issue network requests.
 * @deprecated use https://resthooks.io/docs/api/Controller#fetch
 */
declare function useFetcher<
  Shape extends FetchShape<Schema, Readonly<object>, any>,
>(
  fetchShape: Shape & {
    update?: (...args: any) => Record<string, (...args: any) => any>;
  },
  throttle?: boolean,
): <
  UpdateParams extends OptimisticUpdateParams<
    SchemaFromShape<Shape>,
    FetchShape<any, any, any>
  >[],
>(
  a: Parameters<Shape['fetch']>[0],
  b?: Parameters<Shape['fetch']>[1],
  updateParams?: UpdateParams | undefined,
) => ReturnFromShape<typeof fetchShape>;

/**
 * Imperative control of Rest Hooks store
 * @see https://resthooks.io/docs/api/useController
 */
declare function useController(): Controller;

/**
 * Access a response if it is available.
 *
 * `useCache` guarantees referential equality globally.
 * @see https://resthooks.io/docs/api/useCache
 */
declare function useCache<
  E extends
    | Pick<
        EndpointInterface<FetchFunction, Schema | undefined, undefined>,
        'key' | 'schema' | 'invalidIfStale'
      >
    | Pick<ReadShape<any, any>, 'getFetchKey' | 'schema' | 'options'>,
  Args extends
    | (E extends {
        key: any;
      }
        ? readonly [...Parameters<E['key']>]
        : readonly [ParamsFromShape<E>])
    | readonly [null],
>(
  endpoint: E,
  ...args: Args
): E['schema'] extends {}
  ? DenormalizeNullable<E['schema']>
  : E extends (...args: any) => any
  ? ResolveType<E> | undefined
  : any;

/**
 * Request a resource if it is not in cache.\
 * @see https://resthooks.io/docs/api/useRetrieve
 */
declare function useRetrieve<Shape extends ReadShape<any, any>>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape> | null,
  triggerFetch?: boolean,
  entitiesExpireAt?: number,
): any;

declare type ResourceReturn<
  P,
  S extends {
    fetch: any;
    schema: any;
  },
> = CondNull$1<
  P,
  S['schema'] extends undefined
    ? ResolveType<S['fetch']> | undefined
    : DenormalizeNullable<S['schema']>,
  S['schema'] extends undefined
    ? ResolveType<S['fetch']>
    : Denormalize<S['schema']>
>;
declare type CondNull$1<P, A, B> = P extends null ? A : B;
/**
 * Ensure a resource is available.
 * Suspends until it is.
 *
 * `useResource` guarantees referential equality globally.
 * @see https://resthooks.io/docs/api/useresource
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
>(v1: readonly [S1, P1]): [ResourceReturn<P1, S1>];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
): [ResourceReturn<P1, S1>, ResourceReturn<P2, S2>];
declare function useResource<
  S extends ReadShape<any, any>,
  P extends ParamsFromShape<S> | null,
>(fetchShape: S, params: P): ResourceReturn<P, S>;
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
): [ResourceReturn<P1, S1>, ResourceReturn<P2, S2>, ResourceReturn<P3, S3>];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
  S12 extends ReadShape<any, any>,
  P12 extends ParamsFromShape<S12> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
  v12: readonly [S12, P12],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
  ResourceReturn<P12, S12>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
  S12 extends ReadShape<any, any>,
  P12 extends ParamsFromShape<S12> | null,
  S13 extends ReadShape<any, any>,
  P13 extends ParamsFromShape<S13> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
  v12: readonly [S12, P12],
  v13: readonly [S13, P13],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
  ResourceReturn<P12, S12>,
  ResourceReturn<P13, S13>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
  S12 extends ReadShape<any, any>,
  P12 extends ParamsFromShape<S12> | null,
  S13 extends ReadShape<any, any>,
  P13 extends ParamsFromShape<S13> | null,
  S14 extends ReadShape<any, any>,
  P14 extends ParamsFromShape<S14> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
  v12: readonly [S12, P12],
  v13: readonly [S13, P13],
  v14: readonly [S14, P14],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
  ResourceReturn<P12, S12>,
  ResourceReturn<P13, S13>,
  ResourceReturn<P14, S14>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
  S12 extends ReadShape<any, any>,
  P12 extends ParamsFromShape<S12> | null,
  S13 extends ReadShape<any, any>,
  P13 extends ParamsFromShape<S13> | null,
  S14 extends ReadShape<any, any>,
  P14 extends ParamsFromShape<S14> | null,
  S15 extends ReadShape<any, any>,
  P15 extends ParamsFromShape<S15> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
  v12: readonly [S12, P12],
  v13: readonly [S13, P13],
  v14: readonly [S14, P14],
  v15: readonly [S15, P15],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
  ResourceReturn<P12, S12>,
  ResourceReturn<P13, S13>,
  ResourceReturn<P14, S14>,
  ResourceReturn<P15, S15>,
];
declare function useResource<
  S1 extends ReadShape<any, any>,
  P1 extends ParamsFromShape<S1> | null,
  S2 extends ReadShape<any, any>,
  P2 extends ParamsFromShape<S2> | null,
  S3 extends ReadShape<any, any>,
  P3 extends ParamsFromShape<S3> | null,
  S4 extends ReadShape<any, any>,
  P4 extends ParamsFromShape<S4> | null,
  S5 extends ReadShape<any, any>,
  P5 extends ParamsFromShape<S5> | null,
  S6 extends ReadShape<any, any>,
  P6 extends ParamsFromShape<S6> | null,
  S7 extends ReadShape<any, any>,
  P7 extends ParamsFromShape<S7> | null,
  S8 extends ReadShape<any, any>,
  P8 extends ParamsFromShape<S8> | null,
  S9 extends ReadShape<any, any>,
  P9 extends ParamsFromShape<S9> | null,
  S10 extends ReadShape<any, any>,
  P10 extends ParamsFromShape<S10> | null,
  S11 extends ReadShape<any, any>,
  P11 extends ParamsFromShape<S11> | null,
  S12 extends ReadShape<any, any>,
  P12 extends ParamsFromShape<S12> | null,
  S13 extends ReadShape<any, any>,
  P13 extends ParamsFromShape<S13> | null,
  S14 extends ReadShape<any, any>,
  P14 extends ParamsFromShape<S14> | null,
  S15 extends ReadShape<any, any>,
  P15 extends ParamsFromShape<S15> | null,
  S16 extends ReadShape<any, any>,
  P16 extends ParamsFromShape<S16> | null,
>(
  v1: readonly [S1, P1],
  v2: readonly [S2, P2],
  v3: readonly [S3, P3],
  v4: readonly [S4, P4],
  v5: readonly [S5, P5],
  v6: readonly [S6, P6],
  v7: readonly [S7, P7],
  v8: readonly [S8, P8],
  v9: readonly [S9, P9],
  v10: readonly [S10, P10],
  v11: readonly [S11, P11],
  v12: readonly [S12, P12],
  v13: readonly [S13, P13],
  v14: readonly [S14, P14],
  v15: readonly [S15, P15],
  v16: readonly [S16, P16],
): [
  ResourceReturn<P1, S1>,
  ResourceReturn<P2, S2>,
  ResourceReturn<P3, S3>,
  ResourceReturn<P4, S4>,
  ResourceReturn<P5, S5>,
  ResourceReturn<P6, S6>,
  ResourceReturn<P7, S7>,
  ResourceReturn<P8, S8>,
  ResourceReturn<P9, S9>,
  ResourceReturn<P10, S10>,
  ResourceReturn<P11, S11>,
  ResourceReturn<P12, S12>,
  ResourceReturn<P13, S13>,
  ResourceReturn<P14, S14>,
  ResourceReturn<P15, S15>,
  ResourceReturn<P16, S16>,
];

/**
 * Keeps a resource fresh by subscribing to updates.
 * @see https://resthooks.io/docs/api/useSubscription
 */
declare function useSubscription<
  E extends
    | EndpointInterface<FetchFunction, Schema | undefined, undefined>
    | ReadShape<any, any>,
  Args extends
    | (E extends (...args: any) => any
        ? readonly [...Parameters<E>]
        : readonly [ParamsFromShape<E>])
    | readonly [null],
>(endpoint: E, ...args: Args): void;

/**
 * Gets meta for a fetch key.
 * @see https://resthooks.io/docs/api/useMeta
 */
declare function useMeta<
  E extends
    | Pick<EndpointInterface<FetchFunction>, 'key'>
    | Pick<FetchShape<any, any>, 'getFetchKey'>,
  Args extends
    | (E extends {
        key: any;
      }
        ? readonly [...Parameters<E['key']>]
        : readonly [ParamsFromShape<E>])
    | readonly [null],
>(
  endpoint: E,
  ...args: Args
): {
  readonly date: number;
  readonly error?: ErrorTypes$1 | undefined;
  readonly expiresAt: number;
  readonly prevExpiresAt?: number | undefined;
  readonly invalidated?: boolean | undefined;
  readonly errorPolicy?: 'hard' | 'soft' | undefined;
} | null;

declare type ErrorTypes = NetworkError | UnknownError;
declare type UseErrorReturn<P> = P extends [null]
  ? undefined
  : ErrorTypes | undefined;
/**
 * Get any errors for a given request
 * @see https://resthooks.io/docs/api/useError
 */
declare function useError<
  E extends
    | Pick<
        EndpointInterface<FetchFunction, Schema | undefined, undefined>,
        'key' | 'schema' | 'invalidIfStale'
      >
    | Pick<ReadShape<any, any>, 'getFetchKey' | 'schema' | 'options'>,
  Args extends
    | (E extends {
        key: any;
      }
        ? readonly [...Parameters<E['key']>]
        : readonly [ParamsFromShape<E>])
    | readonly [null],
>(endpoint: E, ...args: Args): UseErrorReturn<typeof args>;

/**
 * Invalidate a certain item within the cache
 * @deprecated use https://resthooks.io/docs/api/Controller#invalidate
 */
declare function useInvalidator<Shape extends ReadShape<any, any>>(
  fetchShape: Shape,
): (params: ParamsFromShape<Shape> | null) => void;

/**
 * Returns a function to completely clear the cache of all entries
 * @deprecated use https://resthooks.io/docs/api/Controller#resetEntireStore
 */
declare function useResetter(): () => void;

/** Build an imperative dispatcher to issue network requests.
 * @deprecated use https://resthooks.io/docs/api/Controller#fetch
 */
declare function useFetchDispatcher(throttle?: boolean): <
  Shape extends FetchShape<Schema, Readonly<object>, any>,
  UpdateParams extends OptimisticUpdateParams<
    SchemaFromShape<Shape>,
    FetchShape<any, any, any>
  >[],
>(
  fetchShape: Shape & {
    update?: (...args: any) => Record<string, (...args: any) => any>;
  },
  params: ParamsFromShape<Shape>,
  body: BodyFromShape<Shape>,
  updateParams?: UpdateParams | undefined,
) => ReturnFromShape<typeof fetchShape>;

/** Invalidate a certain item within the cache
 * @deprecated use https://resthooks.io/docs/api/Controller#invalidate
 */
declare function useInvalidateDispatcher(): <Shape extends ReadShape<any, any>>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape>,
) => void;

/**
 * Request a resource if it is not in cache.
 * @see https://resthooks.io/docs/api/useFetch
 */
declare function useFetch<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args): ReturnType<E> | undefined;

/**
 * Ensure an endpoint is available.
 * Suspends until it is.
 *
 * `useSuspense` guarantees referential equality globally.
 * @see https://resthooks.io/docs/api/useSuspense
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
declare function useSuspense<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(
  endpoint: E,
  ...args: Args
): Args extends [null]
  ? E['schema'] extends Exclude<Schema, null>
    ? DenormalizeNullable<E['schema']>
    : undefined
  : E['schema'] extends Exclude<Schema, null>
  ? Denormalize<E['schema']>
  : ResolveType<E>;

/** @deprecated use https://resthooks.io/docs/api/Controller#getResponse */
declare function hasUsableData(
  fetchShape: Pick<FetchShape<any>, 'options'>,
  cacheReady: boolean,
  deleted: boolean,
  invalidated?: boolean,
): boolean;

declare type CondNull<P, A, B> = P extends null ? A : B;
declare type StatefulReturn<S extends Schema | undefined, P> = CondNull<
  P,
  {
    data: DenormalizeNullable<S>;
    loading: false;
    error: undefined;
  },
  | {
      data: Denormalize<S>;
      loading: false;
      error: undefined;
    }
  | {
      data: DenormalizeNullable<S>;
      loading: true;
      error: undefined;
    }
  | {
      data: DenormalizeNullable<S>;
      loading: false;
      error: ErrorTypes$1;
    }
>;
/**
 * Use async date with { data, loading, error } (DLE)
 * @see https://resthooks.io/docs/guides/no-suspense
 */
declare function useDLE<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(
  endpoint: E,
  ...args: Args
): E['schema'] extends undefined
  ? {
      data: E extends (...args: any) => any ? ResolveType<E> | undefined : any;
      loading: boolean;
      error: ErrorTypes$1 | undefined;
    }
  : StatefulReturn<E['schema'], Args[0]>;

declare const StateContext: React$1.Context<State<unknown>>;
declare const DispatchContext: React$1.Context<
  (value: ActionTypes) => Promise<void>
>;
declare const DenormalizeCacheContext: React$1.Context<DenormalizeCache>;
declare const ControllerContext: React$1.Context<Controller>;
interface Store<S> {
  subscribe(listener: () => void): () => void;
  dispatch: React.Dispatch<ActionTypes>;
  getState(): S;
  uninitialized?: boolean;
}
declare const StoreContext: React$1.Context<Store<State<unknown>>>;

interface Options$2<
  Shape extends FetchShape<
    Schema | undefined,
    Readonly<object>,
    Readonly<object | string> | void
  >,
> {
  params: ParamsFromShape<Shape>;
  body?: BodyFromShape<Shape>;
  throttle: boolean;
  updateParams?:
    | OptimisticUpdateParams<
        SchemaFromShape<Shape>,
        FetchShape<Schema | undefined, any, any>
      >[]
    | undefined;
}
/** Requesting a fetch to begin
 *
 * @param fetchShape
 * @param param1 { params, body, throttle, updateParams }
 */
declare function createFetch<
  Shape extends FetchShape<
    Schema | undefined,
    Readonly<object>,
    Readonly<object | string> | void
  >,
>(
  fetchShape: Shape & {
    update?: (...args: any) => Record<string, (...args: any) => any>;
  },
  { params, body, throttle, updateParams }: Options$2<Shape>,
): FetchAction;

interface Options$1<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any,
> extends Pick<
    FetchAction<Payload, S>['meta'],
    'schema' | 'key' | 'type' | 'updaters' | 'update' | 'args'
  > {
  dataExpiryLength: NonNullable<EndpointExtraOptions['dataExpiryLength']>;
  fetchedAt?: number;
}
/** Update state with data
 *
 * @param data
 * @param param1 { schema, key, type, updaters, dataExpiryLength }
 */
declare function createReceive<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any,
>(
  data: Payload,
  {
    schema,
    key,
    args,
    updaters,
    fetchedAt,
    update,
    dataExpiryLength,
  }: Options$1<Payload, S>,
): ReceiveAction<Payload, S>;

interface Options<S extends Schema | undefined = any>
  extends Pick<FetchAction<any, S>['meta'], 'schema' | 'key' | 'options'> {
  errorExpiryLength: NonNullable<EndpointExtraOptions['errorExpiryLength']>;
  fetchedAt?: number;
}
declare function createReceiveError<S extends Schema | undefined = any>(
  error: Error,
  { schema, key, options, errorExpiryLength, fetchedAt }: Options<S>,
): ReceiveAction;

export {
  AbstractInstanceType,
  ActionTypes,
  _default as BackupBoundary,
  BodyFromShape,
  CacheProvider,
  Controller,
  ControllerContext,
  DeleteShape,
  DenormalizeCacheContext,
  Dispatch,
  DispatchContext,
  EndpointInterface,
  EndpointUpdateFunction,
  EntityInterface,
  ErrorTypes$1 as ErrorTypes,
  ExpiryStatus,
  FetchAction,
  FetchShape,
  GCAction,
  InvalidateAction,
  Manager,
  Middleware,
  MiddlewareAPI,
  MutateShape,
  NetworkError,
  NetworkManager,
  OptimisticAction,
  PK,
  ParamsFromShape,
  ReadShape,
  ReceiveAction,
  ReceiveMeta,
  ReceiveTypes,
  ResetAction,
  ResetError,
  ResolveType,
  ResponseActions,
  ResultEntry,
  ReturnFromShape,
  Schema,
  SetShapeParams,
  State,
  StateContext,
  Store,
  StoreContext,
  SubscribeAction,
  UnknownError,
  UnsubscribeAction,
  UpdateFunction,
  internal_d as __INTERNAL__,
  actionTypes_d as actionTypes,
  applyManager,
  createFetch,
  createReceive,
  createReceiveError,
  createReducer,
  hasUsableData,
  initialState,
  reducer,
  useCache,
  useController,
  useDLE,
  useDenormalized,
  useError,
  useFetch,
  useFetchDispatcher,
  useFetcher,
  useInvalidateDispatcher,
  useInvalidator,
  useMeta,
  usePromisifiedDispatch,
  useResetter,
  useResource,
  useRetrieve,
  useSubscription,
  useSuspense,
};
