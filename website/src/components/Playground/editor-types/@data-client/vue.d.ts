import {
  EndpointInterface,
  FetchFunction,
  Schema,
  ResolveType,
  Denormalize,
  DenormalizeNullable,
  Queryable,
  SchemaArgs,
  ErrorTypes,
  Controller,
  DevToolsManager,
  DevToolsConfig,
  NetworkManager,
  SubscriptionManager,
  Manager,
  State,
  GCInterface,
} from '@data-client/core';
export {
  AbstractInstanceType,
  ActionTypes,
  Controller,
  CreateCountRef,
  DataClientDispatch,
  DefaultConnectionListener,
  Denormalize,
  DenormalizeNullable,
  DevToolsManager,
  Dispatch,
  EndpointExtraOptions,
  EndpointInterface,
  EntityInterface,
  ErrorTypes,
  ExpiryStatus,
  FetchAction,
  FetchFunction,
  GCInterface,
  GCOptions,
  GCPolicy,
  GenericDispatch,
  InvalidateAction,
  LogoutManager,
  Manager,
  Middleware,
  MiddlewareAPI,
  NetworkError,
  NetworkManager,
  Normalize,
  NormalizeNullable,
  PK,
  PollingSubscription,
  Queryable,
  ResetAction,
  ResolveType,
  Schema,
  SchemaArgs,
  SchemaClass,
  SetAction,
  SetResponseAction,
  State,
  SubscribeAction,
  SubscriptionManager,
  UnknownError,
  UnsubscribeAction,
  UpdateFunction,
  actionTypes,
} from '@data-client/core';
import {
  MaybeRefOrGetter,
  DeepReadonly,
  ComputedRef,
  Ref,
  App,
  ShallowRef,
} from 'vue';

/** Maps each parameter to accept raw value, Ref, ComputedRef, or getter */
type MaybeRefsOrGetters<T extends readonly any[]> = {
  readonly [K in keyof T]: MaybeRefOrGetter<T[K]>;
};
/** Maps each parameter to accept raw value, Ref, ComputedRef, or getter, with nullable support */
type MaybeRefsOrGettersNullable<T extends readonly any[]> = {
  readonly [K in keyof T]: MaybeRefOrGetter<T[K] | null>;
};

/**
 * Ensure an endpoint is available.
 * Suspends until it is.
 *
 * @see https://dataclient.io/docs/api/useSuspense
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
declare function useSuspense<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGetters<Parameters<E>>
): Promise<
  DeepReadonly<
    ComputedRef<
      E['schema'] extends undefined | null ? ResolveType<E>
      : Denormalize<E['schema']>
    >
  >
>;
declare function useSuspense<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
): Promise<
  DeepReadonly<
    ComputedRef<
      E['schema'] extends undefined | null ? ResolveType<E> | undefined
      : DenormalizeNullable<E['schema']>
    >
  >
>;

/**
 * Keeps a resource fresh by subscribing to updates.
 * Mirrors React hook API. Pass `null` as first arg to unsubscribe.
 * @see https://dataclient.io/docs/api/useSubscription
 */
declare function useSubscription<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
): void;

/**
 * Query the store.
 *
 * `useQuery` results are globally memoized.
 * @see https://dataclient.io/docs/api/useQuery
 */
declare function useQuery<S extends Queryable>(
  schema: S,
  ...args: MaybeRefsOrGetters<SchemaArgs<S>>
): ComputedRef<DenormalizeNullable<S> | undefined>;

/**
 * Ensure an endpoint is available. Keeps it fresh once it is.
 *
 * useSuspense() + useSubscription()
 * @see https://dataclient.io/docs/api/useLive
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
declare function useLive<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGetters<Parameters<E>>
): Promise<
  DeepReadonly<
    ComputedRef<
      E['schema'] extends undefined | null ? ResolveType<E>
      : Denormalize<E['schema']>
    >
  >
>;
declare function useLive<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
): Promise<
  DeepReadonly<
    ComputedRef<
      E['schema'] extends undefined | null ? ResolveType<E> | undefined
      : DenormalizeNullable<E['schema']>
    >
  >
>;

/**
 * Takes an async function and tracks resolution as a boolean.
 *
 * @see https://dataclient.io/docs/api/useLoading
 * @param func A function returning a promise
 * @example
 ```
 function Button({ onClick, children, ...props }) {
   const [clickHandler, loading] = useLoading(onClick);
   return h('button', { onClick: clickHandler, ...props },
     loading.value ? 'Loading...' : children
   );
 }
 ```
 */
declare function useLoading<F extends (...args: any) => Promise<any>>(
  func: F,
): [F, Ref<boolean>, Ref<Error | undefined>];

/**
 * Keeps value updated after delay time
 *
 * @see https://dataclient.io/docs/api/useDebounce
 * @param value Any immutable value (can be a ref)
 * @param delay Time in milliseconds to wait til updating the value
 * @param updatable Whether to update at all
 * @example
 ```
 const [debouncedQuery, isPending] = useDebounce(query, 200);
 const list = useSuspense(getThings, { query: debouncedQuery.value });
 ```
 */
declare function useDebounce<T>(
  value: T | Ref<T>,
  delay: number,
  updatable?: boolean | Ref<boolean>,
): [Ref<T>, Ref<boolean>];

type FetchPromise<T = any> = Promise<T> & {
  resolved: boolean;
};
/**
 * Fetch an Endpoint if it is not in cache or stale.
 * @see https://dataclient.io/docs/api/useFetch
 */
declare function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGetters<Parameters<E>>
): Readonly<
  Ref<
    FetchPromise<
      E['schema'] extends undefined | null ? ResolveType<E>
      : Denormalize<E['schema']>
    >
  >
>;
declare function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
): Readonly<
  Ref<
    | FetchPromise<
        E['schema'] extends undefined | null ? ResolveType<E>
        : DenormalizeNullable<E['schema']>
      >
    | undefined
  >
>;

/**
 * Read an Endpoint's response if it is ready.
 *
 * `useCache` is globally memoized.
 * @see https://dataclient.io/docs/api/useCache
 */
declare function useCache<
  E extends Pick<
    EndpointInterface<FetchFunction, Schema | undefined, undefined | boolean>,
    'key' | 'schema' | 'invalidIfStale'
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGetters<Parameters<E['key']>>
): ComputedRef<
  E['schema'] extends undefined | null ?
    E extends (...args: any) => any ?
      ResolveType<E> | undefined
    : any
  : DenormalizeNullable<E['schema']>
>;
declare function useCache<
  E extends Pick<
    EndpointInterface<FetchFunction, Schema | undefined, undefined | boolean>,
    'key' | 'schema' | 'invalidIfStale'
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E['key']>> | readonly [null]
): ComputedRef<
  E['schema'] extends undefined | null ?
    E extends (...args: any) => any ?
      ResolveType<E> | undefined
    : any
  : DenormalizeNullable<E['schema']>
>;

/**
 * Use async data with { data, loading, error } (DLE)
 * @see https://dataclient.io/docs/api/useDLE
 */
declare function useDLE<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGetters<Parameters<E>>
): {
  data: ComputedRef<
    E['schema'] extends undefined | null ? ResolveType<E> | undefined
    : Denormalize<E['schema']> | DenormalizeNullable<E['schema']>
  >;
  loading: ComputedRef<boolean>;
  error: ComputedRef<ErrorTypes | undefined>;
};
declare function useDLE<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
): {
  data: ComputedRef<
    E['schema'] extends undefined | null ? undefined
    : DenormalizeNullable<E['schema']>
  >;
  loading: ComputedRef<boolean>;
  error: ComputedRef<ErrorTypes | undefined>;
};

declare function useController(): Controller;

/** Returns the default Managers used by DataProvider.
 *
 * @see https://dataclient.io/docs/api/getDefaultManagers
 */
declare let getDefaultManagers: (options?: GetManagersOptions) => Manager[];

type GetManagersOptions = {
  devToolsManager?: DevToolsManager | DevToolsConfig | null;
  networkManager?:
    NetworkManager | ConstructorArgs<typeof NetworkManager> | null;
  subscriptionManager?:
    SubscriptionManager | ConstructorArgs<typeof SubscriptionManager> | null;
};
type ConstructorArgs<
  T extends {
    new (...args: any): any;
  },
> = T extends new (options: infer O) => any ? O : never;

/** Options for `app.use(DataClientPlugin, options)` */
interface ProvideOptions {
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: new (props: { gcPolicy: GCInterface }) => Controller;
  gcPolicy?: GCInterface;
  /** @internal Set by DataClientPlugin */
  app?: App;
}
/** @deprecated Internal to DataClientPlugin; will stop being exported */
interface ProvidedDataClient {
  controller: InstanceType<typeof Controller>;
  /** Optimistic overlay state ref provided to consumers */
  stateRef: ShallowRef<State<unknown>>;
  /** Start the provider (called on mount) */
  start: () => void;
  /** Stop the provider (called on unmount) */
  stop: () => void;
}
/**
 * Core provider logic used by DataClientPlugin.
 *
 * @deprecated Internal to DataClientPlugin; will stop being exported. Use DataClientPlugin instead.
 */
declare function createDataClient(options?: ProvideOptions): ProvidedDataClient;

/**
 * Vue 3 Plugin for Reactive Data Client
 *
 * Usage:
 * ```ts
 * import { createApp } from 'vue';
 * import { DataClientPlugin } from '@data-client/vue';
 *
 * const app = createApp(App);
 * app.use(DataClientPlugin, {
 *   managers: getDefaultManagers(),
 *   initialState: customInitialState,
 * });
 * app.mount('#app');
 * ```
 */
declare const DataClientPlugin: {
  install(app: App, options?: ProvideOptions): ProvidedDataClient;
};
declare module 'vue' {
  interface ComponentCustomProperties {
    $dataClient: Controller;
  }
}

export {
  DataClientPlugin,
  type MaybeRefsOrGetters,
  type MaybeRefsOrGettersNullable,
  type ProvideOptions,
  type ProvidedDataClient,
  createDataClient,
  getDefaultManagers,
  useCache,
  useController,
  useDLE,
  useDebounce,
  useFetch,
  useLive,
  useLoading,
  useQuery,
  useSubscription,
  useSuspense,
};
