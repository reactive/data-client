import {
  NetworkError as NetworkError$1,
  Dispatch as Dispatch$1,
  State as State$1,
  Controller,
  ActionTypes,
  CacheProvider as CacheProvider$1,
  Manager,
  Middleware as Middleware$1,
  SubscribeAction,
  UnsubscribeAction,
  Schema as Schema$1,
  __INTERNAL__,
  initialState,
  StateContext,
  DispatchContext,
  hasUsableData,
} from '@rest-hooks/core';
export {
  AbstractInstanceType,
  ActionTypes,
  DeleteShape,
  Dispatch,
  FetchAction,
  FetchShape,
  InvalidateAction,
  Manager,
  Middleware,
  MiddlewareAPI,
  MutateShape,
  PK,
  ParamsFromShape,
  ReadShape,
  ReceiveAction,
  ReceiveTypes,
  ResetAction,
  SetShapeParams,
  State,
  SubscribeAction,
  UnsubscribeAction,
  UpdateFunction,
  useCache,
  useController,
  useDLE,
  useDenormalized,
  useError,
  useFetch,
  useFetcher,
  useInvalidator,
  useMeta,
  usePromisifiedDispatch,
  useResetter,
  useResource,
  useRetrieve,
  useSubscription,
  useSuspense,
} from '@rest-hooks/core';
import React from 'react';

declare type AbstractInstanceType<T> = T extends {
  prototype: infer U;
}
  ? U
  : never;
declare type DenormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Denormalize<S[K]> : S[K];
};
declare type DenormalizeNullableObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? DenormalizeNullable<S[K]> : S[K];
};
declare type NormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Normalize<S[K]> : S[K];
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
declare type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> =
  keyof S['schema'] extends never
    ? S['prototype']
    : string extends keyof S['schema']
    ? S['prototype']
    : S['prototype'] & {
        [K in keyof S['schema']]: DenormalizeNullable<S['schema'][K]>;
      };
declare type DenormalizeReturnType<T> = T extends (
  input: any,
  unvisit: any,
) => [infer R, any, any]
  ? R
  : never;
declare type NormalizeReturnType<T> = T extends (...args: any) => infer R
  ? R
  : never;
declare type Denormalize<S> = S extends EntityInterface<infer U>
  ? U
  : S extends RecordClass
  ? AbstractInstanceType<S>
  : S extends SchemaClass
  ? DenormalizeReturnType<S['denormalize']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Denormalize<F>[]
  : S extends {
      [K: string]: any;
    }
  ? DenormalizeObject<S>
  : S;
declare type DenormalizeNullable<S> = S extends EntityInterface<any>
  ? DenormalizeNullableNestedSchema<S> | undefined
  : S extends RecordClass
  ? DenormalizeNullableNestedSchema<S>
  : S extends SchemaClass
  ? DenormalizeReturnType<S['_denormalizeNullable']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Denormalize<F>[] | undefined
  : S extends {
      [K: string]: any;
    }
  ? DenormalizeNullableObject<S>
  : S;
declare type Normalize<S> = S extends EntityInterface
  ? string
  : S extends RecordClass
  ? NormalizeObject<S['schema']>
  : S extends SchemaClass
  ? NormalizeReturnType<S['normalize']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Normalize<F>[]
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
  ? Normalize<F>[] | undefined
  : S extends {
      [K: string]: any;
    }
  ? NormalizedNullableObject<S>
  : S;

/** Get the Params type for a given Shape */
declare type EndpointParam<E> = E extends (first: infer A, ...rest: any) => any
  ? A
  : E extends {
      key: (first: infer A, ...rest: any) => any;
    }
  ? A
  : never;
/** What the function's promise resolves to */
declare type ResolveType<E extends (...args: any) => any> =
  ReturnType<E> extends Promise<infer R> ? R : never;
declare type PartialArray<A> = A extends []
  ? []
  : A extends [infer F]
  ? [F] | []
  : A extends [infer F, ...infer Rest]
  ? [F] | [F, ...PartialArray<Rest>]
  : A extends (infer T)[]
  ? T[]
  : never;

interface NetworkError extends Error {
  status: number;
  response?: Response;
}
interface UnknownError extends Error {
  status?: unknown;
  response?: unknown;
}
declare type ErrorTypes = NetworkError | UnknownError;

interface SnapshotInterface {
  getResponse: <
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
    Args extends readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...args: Args
  ) => {
    data: DenormalizeNullable<E['schema']>;
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
declare type ExpiryStatusInterface = 1 | 2 | 3;

declare type FetchFunction<A extends readonly any[] = any, R = any> = (
  ...args: A
) => Promise<R>;
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
/** Defines a networking endpoint */
interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointExtraOptions<F> {
  (...args: Parameters<F>): ReturnType<F>;
  key(...args: Parameters<F>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}
/** To change values on the server */
interface MutateEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
> extends EndpointInterface<F, S, true> {
  sideEffect: true;
}
/** For retrieval requests */
declare type ReadEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
> = EndpointInterface<F, S, undefined>;

/* eslint-disable @typescript-eslint/ban-types */

interface EndpointOptions<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = undefined,
  M extends true | undefined = undefined,
> extends EndpointExtraOptions<F> {
  key?: (...args: Parameters<F>) => string;
  sideEffect?: M;
  schema?: S;
  [k: string]: any;
}

interface EndpointExtendOptions<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointOptions<F, S, M> {
  fetch?: FetchFunction;
}

type KeyofEndpointInstance = keyof EndpointInstance<FetchFunction>;

type ExtendedEndpoint<
  O extends EndpointExtendOptions<F>,
  E extends EndpointInstance<
    FetchFunction,
    Schema | undefined,
    true | undefined
  >,
  F extends FetchFunction,
> = EndpointInstance<
  'fetch' extends keyof O ? Exclude<O['fetch'], undefined> : E['fetch'],
  'schema' extends keyof O ? O['schema'] : E['schema'],
  'sideEffect' extends keyof O ? O['sideEffect'] : E['sideEffect']
> &
  Omit<O, KeyofEndpointInstance> &
  Omit<E, KeyofEndpointInstance>;

/**
 * Defines an async data source.
 * @see https://resthooks.io/docs/api/Endpoint
 */
interface EndpointInstance<
  F extends (...args: any) => Promise<any> = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointInstanceInterface<F, S, M> {
  extend<
    E extends EndpointInstance<
      (...args: any) => Promise<any>,
      Schema | undefined,
      true | undefined
    >,
    O extends EndpointExtendOptions<F> &
      Partial<Omit<E, keyof EndpointInstance<FetchFunction>>> &
      Record<string, unknown>,
  >(
    this: E,
    options: Readonly<O>,
  ): ExtendedEndpoint<typeof options, E, F>;
}

/**
 * Defines an async data source.
 * @see https://resthooks.io/docs/api/Endpoint
 */
interface EndpointInstanceInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointInterface<F, S, M> {
  constructor: EndpointConstructor;

  /**
   * Calls the function, substituting the specified object for the this value of the function, and the specified array for the arguments of the function.
   * @param thisArg The object to be used as the this object.
   * @param argArray A set of arguments to be passed to the function.
   */
  apply<E extends FetchFunction>(
    this: E,
    thisArg: ThisParameterType<E>,
    argArray?: Parameters<E>,
  ): ReturnType<E>;

  /**
   * Calls a method of an object, substituting another object for the current object.
   * @param thisArg The object to be used as the current object.
   * @param argArray A list of arguments to be passed to the method.
   */
  call<E extends FetchFunction>(
    this: E,
    thisArg: ThisParameterType<E>,
    ...argArray: Parameters<E>
  ): ReturnType<E>;

  /**
   * For a given function, creates a bound function that has the same body as the original function.
   * The this object of the bound function is associated with the specified object, and has the specified initial parameters.
   * @param thisArg An object to which the this keyword can refer inside the new function.
   * @param argArray A list of arguments to be passed to the new function.
   */
  bind<E extends FetchFunction, P extends PartialArray<Parameters<E>>>(
    this: E,
    thisArg: ThisParameterType<E>,
    ...args: readonly [...P]
  ): EndpointInstance<
    (...args: readonly [...RemoveArray<Parameters<E>, P>]) => ReturnType<E>,
    S,
    M
  > &
    Omit<E, keyof EndpointInstance<FetchFunction>>;

  /** Returns a string representation of a function. */
  toString(): string;

  prototype: any;
  readonly length: number;

  // Non-standard extensions
  arguments: any;
  caller: F;

  key(...args: Parameters<F>): string;

  readonly sideEffect: M;

  readonly schema: S;

  fetch: F;

  /** The following is for compatibility with FetchShape */
  /** @deprecated */
  readonly type: M extends undefined
    ? 'read'
    : IfAny<M, any, IfTypeScriptLooseNull<'read', 'mutate'>>;

  /** @deprecated */
  getFetchKey(...args: OnlyFirst<Parameters<F>>): string;
  /** @deprecated */
  options?: EndpointExtraOptions<F>;
}

interface EndpointConstructor {
  new <
    F extends (
      this: EndpointInstance<FetchFunction> & E,
      params?: any,
      body?: any,
    ) => Promise<any>,
    S extends Schema | undefined = undefined,
    M extends true | undefined = undefined,
    E extends Record<string, any> = {},
  >(
    fetchFunction: F,
    options?: EndpointOptions<F, S, M> & E,
  ): EndpointInstance<F, S, M> & E;
  readonly prototype: Function;
}
declare let Endpoint: EndpointConstructor;

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
type IfTypeScriptLooseNull<Y, N> = 1 | undefined extends 1 ? Y : N;

type OnlyFirst<A extends unknown[]> = A extends [] ? [] : [A[0]];

type RemoveArray<Orig extends any[], Rem extends any[]> = Rem extends [
  any,
  ...infer RestRem,
]
  ? Orig extends [any, ...infer RestOrig]
    ? RemoveArray<RestOrig, RestRem>
    : never
  : Orig;

/**
 * Performant lookups by secondary indexes
 * @see https://resthooks.io/docs/api/Index
 */
declare class Index<S extends Schema, P = Readonly<IndexParams<S>>> {
  schema: S;
  constructor(schema: S, key?: (params: P) => string);
  key(params?: P): string;
  /** The following is for compatibility with FetchShape */
  getFetchKey: (params: P) => string;
}
declare type ArrayElement<ArrayType extends unknown[] | readonly unknown[]> =
  ArrayType[number];
declare type IndexParams<S extends Schema> = S extends {
  indexes: readonly string[];
}
  ? {
      [K in Extract<
        ArrayElement<S['indexes']>,
        keyof AbstractInstanceType<S>
      >]?: AbstractInstanceType<S>[K];
    }
  : Readonly<object>;

interface Props$1<E extends NetworkError$1> {
  children: React.ReactNode;
  fallbackComponent: React.ComponentType<{
    error: E;
  }>;
}
interface State<E extends NetworkError$1> {
  error?: E;
}
/**
 * Handles any networking errors from useResource()
 * @see https://resthooks.io/docs/api/NetworkErrorBoundary
 */
declare class NetworkErrorBoundary<
  E extends NetworkError$1,
> extends React.Component<Props$1<E>, State<E>> {
  static defaultProps: {
    fallbackComponent: ({ error }: { error: NetworkError$1 }) => JSX.Element;
  };

  static getDerivedStateFromError(error: NetworkError$1 | any): {
    error: NetworkError$1;
  };

  state: State<E>;
  render(): JSX.Element;
}

declare const PromiseifyMiddleware: <R extends React.Reducer<any, any>>(
  _: unknown,
) => (next: Dispatch$1<R>) => (action: React.ReducerAction<R>) => Promise<void>;
//# sourceMappingURL=PromiseifyMiddleware.d.ts.map

interface Store<S> {
  subscribe(listener: () => void): () => void;
  dispatch: React.Dispatch<ActionTypes>;
  getState(): S;
}
interface Props<S> {
  children: React.ReactNode;
  store: Store<S>;
  selector: (state: S) => State$1<unknown>;
  controller: Controller;
}
declare function ExternalCacheProvider<S>({
  children,
  store,
  selector,
  controller,
}: Props<S>): JSX.Element;

interface MiddlewareAPI<
  R extends React.Reducer<any, any> = React.Reducer<any, any>,
> {
  getState: () => React.ReducerState<R>;
  dispatch: Dispatch<R>;
}
declare type Dispatch<R extends React.Reducer<any, any>> = (
  action: React.ReducerAction<R>,
) => Promise<void>;
declare type Middleware = <R extends React.Reducer<any, any>>({
  dispatch,
}: MiddlewareAPI<R>) => (next: Dispatch<R>) => Dispatch<R>;

declare const mapMiddleware: <M extends Middleware[]>(
  selector: (state: any) => State$1<unknown>,
) => (...middlewares: Middleware[]) => M;
//# sourceMappingURL=mapMiddleware.d.ts.map

declare const CacheProvider: typeof CacheProvider$1;
//# sourceMappingURL=index.d.ts.map

/** Use selector to access part of state */
declare function useSelectionUnstable<
  Params extends Readonly<object> | Readonly<object>[],
  F extends (state: State$1<unknown>, params: Params) => any,
>(
  select: F,
  params: Params | null,
  paramSerializer?: (p: Params) => string,
): ReturnType<F> | null;

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
  schema?: Schema$1 | undefined;
  fetch: () => Promise<any>;
  key: string;
  getState: () => State$1<unknown>;
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
    dispatch: Dispatch$1<any>,
    getState: () => State$1<unknown>,
  ): void;

  /** Called when middleware intercepts 'rest-hooks/unsubscribe' action.
   *
   */
  protected handleUnsubscribe(
    action: UnsubscribeAction,
    dispatch: Dispatch$1<any>,
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
  protected readonly schema: Schema$1 | undefined;
  protected readonly fetch: () => Promise<any>;
  protected readonly key: string;
  protected frequency: number;
  protected frequencyHistogram: Map<number, number>;
  protected dispatch: Dispatch$1<any>;
  protected getState: () => State$1<unknown>;
  protected intervalId?: ReturnType<typeof setInterval>;
  protected lastIntervalId?: ReturnType<typeof setInterval>;
  protected startId?: ReturnType<typeof setTimeout>;
  private connectionListener;
  constructor(
    { key, schema, fetch, frequency, getState }: SubscriptionInit,
    dispatch: Dispatch$1<any>,
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
  init(state: State$1<any>): void;
  /** Ensures all subscriptions are cleaned up. */
  cleanup(): void;
  /** Attaches Manager to store
   *
   */
  getMiddleware<T extends DevToolsManager>(this: T): Middleware$1;
}

declare const inferResults: typeof __INTERNAL__.inferResults;
declare const RIC: (cb: (...args: any[]) => void, options: any) => void;

declare const internal_d_inferResults: typeof inferResults;
declare const internal_d_RIC: typeof RIC;
declare const internal_d_initialState: typeof initialState;
declare const internal_d_StateContext: typeof StateContext;
declare const internal_d_DispatchContext: typeof DispatchContext;
declare const internal_d_hasUsableData: typeof hasUsableData;
declare namespace internal_d {
  export {
    internal_d_inferResults as inferResults,
    internal_d_RIC as RIC,
    internal_d_initialState as initialState,
    internal_d_StateContext as StateContext,
    internal_d_DispatchContext as DispatchContext,
    internal_d_hasUsableData as hasUsableData,
  };
}

export {
  ArrayElement,
  CacheProvider,
  ConnectionListener,
  DefaultConnectionListener,
  Denormalize,
  DenormalizeNullable,
  DevToolsConfig,
  DevToolsManager,
  Endpoint,
  EndpointExtraOptions,
  EndpointInterface,
  EndpointParam,
  ExternalCacheProvider,
  FetchFunction,
  EndpointExtraOptions as FetchOptions,
  Index,
  IndexParams,
  MutateEndpoint,
  NetworkError,
  NetworkErrorBoundary,
  Normalize,
  NormalizeNullable,
  PollingSubscription,
  PromiseifyMiddleware,
  ReadEndpoint,
  ResolveType,
  Schema,
  SubscriptionManager,
  internal_d as __INTERNAL__,
  mapMiddleware,
  useSelectionUnstable,
};
