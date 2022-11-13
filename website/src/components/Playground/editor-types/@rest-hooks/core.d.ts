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
declare type NormalizeNullable$1<S> = S extends EntityInterface
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
): NormalizeNullable$1<S>;

declare const DELETED: unique symbol;

interface NetworkError extends Error {
  status: number;
  response?: Response;
}
interface UnknownError extends Error {
  status?: unknown;
  response?: unknown;
}
declare type ErrorTypes = NetworkError | UnknownError;

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
    data: any;
    expiryStatus: ExpiryStatusInterface;
    expiresAt: number;
  };
  getError: <
    E extends Pick<EndpointInterface, 'key'>,
    Args extends readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...args: Args
  ) => ErrorTypes | undefined;
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
declare type NormalizeNullable<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? NormalizeNullable$1<S>
    : NormalizeNullable$1<Extract<S, EntityInterface[]>>
  : NormalizeNullable$1<Extract<S, EntityInterface>>;

declare const RIC: (cb: (...args: any[]) => void, options: any) => void;

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
  ) => ErrorTypes | undefined;

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
      'key' | 'schema' | 'invalidIfStale'
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

interface MiddlewareAPI$1<R extends Reducer<any, any> = Reducer<any, any>> {
  getState: () => ReducerState<R>;
  dispatch: Dispatch<R>;
  controller: Controller;
}
declare type Dispatch<R extends Reducer<any, any>> = (
  action: ReducerAction<R>,
) => Promise<void>;
declare type Middleware$1 = <R extends Reducer<any, any>>({
  dispatch,
}: MiddlewareAPI$1<R>) => (next: Dispatch<R>) => Dispatch<R>;
declare type Reducer<S, A> = (prevState: S, action: A) => S;
declare type ReducerState<R extends Reducer<any, any>> = R extends Reducer<
  infer S,
  any
>
  ? S
  : never;
declare type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<
  any,
  infer A
>
  ? A
  : never;

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
  getMiddleware(): Middleware$1;
  cleanup(): void;
  init?: (state: State<any>) => void;
}

declare const initialState: State<unknown>;
declare function createReducer(
  controller: Controller,
): (state: State<unknown> | undefined, action: ActionTypes) => State<unknown>;

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
  protected middleware: Middleware$1;
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
  getMiddleware<T extends NetworkManager>(this: T): Middleware$1;
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
): Middleware[];
interface MiddlewareAPI<R extends Reducer<any, any> = Reducer<any, any>> {
  getState: () => ReducerState<R>;
  dispatch: Dispatch<R>;
}
declare type Middleware = <R extends Reducer<any, any>>({
  dispatch,
}: MiddlewareAPI<R>) => (next: Dispatch<R>) => Dispatch<R>;

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
  new (init: SubscriptionInit, dispatch: Dispatch<any>): Subscription;
}
/** Handles subscription actions -> fetch or receive actions
 *
 * Constructor takes a SubscriptionConstructable class to control how
 * subscriptions are handled. (e.g., polling, websockets)
 */
declare class SubscriptionManager<S extends SubscriptionConstructable>
  implements Manager
{
  protected subscriptions: {
    [key: string]: InstanceType<S>;
  };

  protected readonly Subscription: S;
  protected middleware: Middleware$1;
  constructor(Subscription: S);
  /** Ensures all subscriptions are cleaned up. */
  cleanup(): void;
  /** Called when middleware intercepts 'rest-hooks/subscribe' action.
   *
   */
  protected handleSubscribe(
    action: SubscribeAction,
    dispatch: Dispatch<any>,
    getState: () => State<unknown>,
  ): void;

  /** Called when middleware intercepts 'rest-hooks/unsubscribe' action.
   *
   */
  protected handleUnsubscribe(
    action: UnsubscribeAction,
    dispatch: Dispatch<any>,
  ): void;

  /** Attaches Manager to store
   *
   * Intercepts 'rest-hooks/subscribe'/'rest-hooks/unsubscribe' to register resources that
   * need to be kept up to date.
   *
   * Will possibly dispatch 'rest-hooks/fetch' or 'rest-hooks/receive' to keep resources fresh
   *
   */
  getMiddleware<T extends SubscriptionManager<any>>(this: T): Middleware$1;
}

/**
 * PollingSubscription keeps a given resource updated by
 * dispatching a fetch at a rate equal to the minimum update
 * interval requested.
 */
declare class PollingSubscription implements Subscription {
  protected readonly schema: Schema | undefined;
  protected readonly fetch: () => Promise<any>;
  protected readonly key: string;
  protected frequency: number;
  protected frequencyHistogram: Map<number, number>;
  protected dispatch: Dispatch<any>;
  protected getState: () => State<unknown>;
  protected intervalId?: ReturnType<typeof setInterval>;
  protected lastIntervalId?: ReturnType<typeof setInterval>;
  protected startId?: ReturnType<typeof setTimeout>;
  private connectionListener;
  constructor(
    { key, schema, fetch, frequency, getState }: SubscriptionInit,
    dispatch: Dispatch<any>,
    connectionListener?: ConnectionListener,
  );

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

declare type DevToolsConfig = {
  [k: string]: unknown;
  name: string;
};
/** Integrates with https://github.com/zalmoxisus/redux-devtools-extension
 *
 * Options: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
 */
declare class DevToolsManager implements Manager {
  protected middleware: Middleware$1;
  protected devTools: undefined | any;
  constructor(
    config?: DevToolsConfig,
    skipLogging?: (action: ActionTypes) => boolean,
  );

  /** Called when initial state is ready */
  init(state: State<any>): void;
  /** Ensures all subscriptions are cleaned up. */
  cleanup(): void;
  /** Attaches Manager to store
   *
   */
  getMiddleware<T extends DevToolsManager>(this: T): Middleware$1;
}

export {
  AbstractInstanceType,
  ActionTypes,
  BodyFromShape,
  ConnectionListener,
  Controller,
  DefaultConnectionListener,
  DeleteShape,
  Denormalize,
  DenormalizeCache,
  DenormalizeNullable,
  DevToolsConfig,
  DevToolsManager,
  Dispatch,
  EndpointExtraOptions,
  EndpointInterface,
  EndpointUpdateFunction,
  EntityInterface,
  ErrorTypes,
  ExpiryStatus,
  FetchAction,
  FetchFunction,
  FetchShape,
  GCAction,
  InvalidateAction,
  Manager,
  Middleware$1 as Middleware,
  MiddlewareAPI$1 as MiddlewareAPI,
  MutateShape,
  NetworkError,
  NetworkManager,
  Normalize,
  NormalizeNullable,
  OptimisticAction,
  PK,
  ParamsFromShape,
  PollingSubscription,
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
  SubscribeAction,
  SubscriptionManager,
  UnknownError,
  UnsubscribeAction,
  UpdateFunction,
  internal_d as __INTERNAL__,
  actionTypes_d as actionTypes,
  applyManager,
  createReducer,
  initialState,
  index_d as legacyActions,
  reducer,
};
