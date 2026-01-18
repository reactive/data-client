import type {
  ErrorTypes,
  SnapshotInterface,
  Schema,
  Denormalize,
  Queryable,
  SchemaArgs,
} from '@data-client/normalizr';
import {
  ExpiryStatus,
  EndpointInterface,
  FetchFunction,
  ResolveType,
  DenormalizeNullable,
  EntityPath,
  MemoCache,
  isEntity,
  denormalize,
  validateQueryKey,
} from '@data-client/normalizr';

import AbortOptimistic from './AbortOptimistic.js';
import {
  createUnsubscription,
  createSubscription,
} from './actions/createSubscription.js';
import {
  createExpireAll,
  createFetch,
  createInvalidate,
  createInvalidateAll,
  createReset,
  createSet,
  createSetResponse,
} from './actions/index.js';
import ensurePojo from './ensurePojo.js';
import type { EndpointUpdateFunction } from './types.js';
import { ReduxMiddlewareAPI } from '../manager/applyManager.js';
import type { GCInterface } from '../state/GCPolicy.js';
import { ImmortalGCPolicy } from '../state/GCPolicy.js';
import { initialState } from '../state/reducer/createReducer.js';
import selectMeta from '../state/selectMeta.js';
import type { ActionTypes, State } from '../types.js';

export type GenericDispatch = (value: any) => Promise<void>;
export type DataClientDispatch = (value: ActionTypes) => Promise<void>;

export interface ControllerConstructorProps<
  D extends GenericDispatch = DataClientDispatch,
> {
  dispatch?: D;
  getState?: () => State<unknown>;
  memo?: Pick<MemoCache, 'denormalize' | 'query' | 'buildQueryKey'>;
  gcPolicy?: GCInterface;
}

const unsetDispatch = (action: unknown): Promise<void> => {
  throw new Error(
    `Dispatching while constructing your middleware is not allowed. ` +
      `Other middleware would not be applied to this dispatch.`,
  );
};
const unsetState = (): State<unknown> => {
  // This is only the value until it is set by the DataProvider
  /* istanbul ignore next */
  return initialState;
};

/**
 * Imperative control of Reactive Data Client store
 * @see https://dataclient.io/docs/api/Controller
 */
export default class Controller<
  // NOTE: We template on entire dispatch, so we can be contravariant on ActionTypes
  D extends GenericDispatch = DataClientDispatch,
> {
  /**
   * Dispatches an action to Reactive Data Client reducer.
   *
   * @see https://dataclient.io/docs/api/Controller#dispatch
   */
  declare protected _dispatch: D;
  /**
   * Gets the latest state snapshot that is fully committed.
   *
   * This can be useful for imperative use-cases like event handlers.
   * This should *not* be used to render; instead useSuspense() or useCache()
   * @see https://dataclient.io/docs/api/Controller#getState
   */
  declare getState: () => State<unknown>;
  /**
   * Singleton to maintain referential equality between calls
   */
  declare readonly memo: Pick<
    MemoCache,
    'denormalize' | 'query' | 'buildQueryKey'
  >;

  /**
   * Handles garbage collection
   */
  declare readonly gcPolicy: GCInterface;

  constructor({
    dispatch = unsetDispatch as any,
    getState = unsetState,
    memo = new MemoCache(),
    gcPolicy = new ImmortalGCPolicy(),
  }: ControllerConstructorProps<D> = {}) {
    this._dispatch = dispatch;
    this.getState = getState;
    this.memo = memo;
    this.gcPolicy = gcPolicy;
  }

  // TODO: drop when drop support for destructuring (0.14 and below)
  set dispatch(dispatch: D) {
    /* istanbul ignore next */
    this._dispatch = dispatch;
  }

  // TODO: drop when drop support for destructuring (0.14 and below)
  get dispatch(): D {
    return this._dispatch;
  }

  bindMiddleware({
    dispatch,
    getState,
  }: {
    dispatch: D;
    getState: ReduxMiddlewareAPI['getState'];
  }) {
    this._dispatch = dispatch;
    this.getState = getState;
  }

  /*************** Action Dispatchers ***************/

  /**
   * Fetches the endpoint with given args, updating the Reactive Data Client cache with the response or error upon completion.
   * @see https://dataclient.io/docs/api/Controller#fetch
   */
  fetch = <
    E extends EndpointInterface & { update?: EndpointUpdateFunction<E> },
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ): E['schema'] extends undefined | null ? ReturnType<E>
  : Promise<Denormalize<E['schema']>> => {
    const action = createFetch(endpoint, {
      args,
    });
    this.dispatch(action);

    if (endpoint.schema) {
      return action.meta.promise.then(input =>
        denormalize(endpoint.schema, input, {}, args),
      ) as any;
    }
    return action.meta.promise as any;
  };

  /**
   * Fetches only if endpoint is considered 'stale'; otherwise returns undefined
   * @see https://dataclient.io/docs/api/Controller#fetchIfStale
   */
  fetchIfStale = <
    E extends EndpointInterface & { update?: EndpointUpdateFunction<E> },
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ): E['schema'] extends undefined | null ? ReturnType<E> | ResolveType<E>
  : Promise<Denormalize<E['schema']>> | Denormalize<E['schema']> => {
    const { data, expiresAt, expiryStatus } = this.getResponseMeta(
      endpoint,
      ...args,
      this.getState(),
    );
    if (expiryStatus !== ExpiryStatus.Invalid && Date.now() <= expiresAt)
      return data as any;
    return this.fetch(endpoint, ...args);
  };

  /**
   * Forces refetching and suspense on useSuspense with the same Endpoint and parameters.
   * @see https://dataclient.io/docs/api/Controller#invalidate
   */
  invalidate = <E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ): Promise<void> =>
    args[0] !== null ?
      this.dispatch(
        createInvalidate(endpoint, {
          args: args as Parameters<E>,
        }),
      )
    : Promise.resolve();

  /**
   * Forces refetching and suspense on useSuspense on all matching endpoint result keys.
   * @see https://dataclient.io/docs/api/Controller#invalidateAll
   * @returns Promise that resolves when invalidation is commited.
   */
  invalidateAll = (options: { testKey: (key: string) => boolean }) =>
    this.dispatch(createInvalidateAll((key: string) => options.testKey(key)));

  /**
   * Sets all matching endpoint result keys to be STALE.
   * @see https://dataclient.io/docs/api/Controller#expireAll
   * @returns Promise that resolves when expiry is commited. *NOT* fetch promise
   */
  expireAll = (options: { testKey: (key: string) => boolean }) =>
    this.dispatch(createExpireAll((key: string) => options.testKey(key)));

  /**
   * Resets the entire Reactive Data Client cache. All inflight requests will not resolve.
   * @see https://dataclient.io/docs/api/Controller#resetEntireStore
   */
  resetEntireStore = (): Promise<void> => this.dispatch(createReset());

  /**
   * Sets value for the Queryable and args.
   * @see https://dataclient.io/docs/api/Controller#set
   */
  set<S extends Queryable>(
    schema: S,
    ...rest: readonly [...SchemaArgs<S>, (previousValue: Denormalize<S>) => {}]
  ): Promise<void>;

  set<S extends Queryable>(
    schema: S,
    ...rest: readonly [...SchemaArgs<S>, {}]
  ): Promise<void>;

  set<S extends Queryable>(
    schema: S,
    ...rest: readonly [...SchemaArgs<S>, any]
  ): Promise<void> {
    const value = rest[rest.length - 1];
    const action = createSet(schema, {
      args: rest.slice(0, rest.length - 1) as SchemaArgs<S>,
      value,
    });
    // TODO: reject with error if this fails in reducer
    return this.dispatch(action);
  }

  /**
   * Sets response for the Endpoint and args.
   * @see https://dataclient.io/docs/api/Controller#setResponse
   */
  setResponse = <
    E extends EndpointInterface & {
      update?: EndpointUpdateFunction<E>;
    },
  >(
    endpoint: E,
    ...rest: readonly [...Parameters<E>, any]
  ): Promise<void> => {
    const response: ResolveType<E> = rest[rest.length - 1];
    const action = createSetResponse(endpoint, {
      args: rest.slice(0, rest.length - 1) as Parameters<E>,
      response,
    });
    return this.dispatch(action);
  };

  /**
   * Sets an error response for the Endpoint and args.
   * @see https://dataclient.io/docs/api/Controller#setError
   */
  setError = <
    E extends EndpointInterface & {
      update?: EndpointUpdateFunction<E>;
    },
  >(
    endpoint: E,
    ...rest: readonly [...Parameters<E>, Error]
  ): Promise<void> => {
    const response: Error = rest[rest.length - 1];
    const action = createSetResponse(endpoint, {
      args: rest.slice(0, rest.length - 1) as Parameters<E>,
      response,
      error: true,
    });
    return this.dispatch(action);
  };

  /**
   * Resolves an inflight fetch.
   * @see https://dataclient.io/docs/api/Controller#resolve
   */
  resolve = <
    E extends EndpointInterface & {
      update?: EndpointUpdateFunction<E>;
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
  ): Promise<void> => {
    return this.dispatch(createSetResponse(endpoint, meta as any));
  };

  /**
   * Marks a new subscription to a given Endpoint.
   * @see https://dataclient.io/docs/api/Controller#subscribe
   */
  subscribe = <
    E extends EndpointInterface<
      FetchFunction,
      Schema | undefined,
      undefined | false
    >,
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ): Promise<void> =>
    args[0] !== null ?
      this.dispatch(
        createSubscription(endpoint, {
          args: args as Parameters<E>,
        }),
      )
    : Promise.resolve();

  /**
   * Marks completion of subscription to a given Endpoint.
   * @see https://dataclient.io/docs/api/Controller#unsubscribe
   */
  unsubscribe = <
    E extends EndpointInterface<
      FetchFunction,
      Schema | undefined,
      undefined | false
    >,
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ): Promise<void> =>
    args[0] !== null ?
      this.dispatch(
        createUnsubscription(endpoint, {
          args: args as Parameters<E>,
        }),
      )
    : Promise.resolve();

  /*************** More ***************/

  /* TODO:
  abort = <E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ): Promise<void>
  */

  /**
   * Gets a snapshot (https://dataclient.io/docs/api/Snapshot)
   * @see https://dataclient.io/docs/api/Controller#snapshot
   */
  snapshot = (state: State<unknown>, fetchedAt?: number): Snapshot<unknown> => {
    return new Snapshot(this, state, fetchedAt);
  };

  /**
   * Gets the error, if any, for a given endpoint. Returns undefined for no errors.
   * @see https://dataclient.io/docs/api/Controller#getError
   */
  getError<E extends EndpointInterface>(
    endpoint: E,
    ...rest:
      | readonly [null, State<unknown>]
      | readonly [...Parameters<E>, State<unknown>]
  ): ErrorTypes | undefined;

  getError<E extends Pick<EndpointInterface, 'key'>>(
    endpoint: E,
    ...rest:
      | readonly [null, State<unknown>]
      | readonly [...Parameters<E['key']>, State<unknown>]
  ): ErrorTypes | undefined;

  getError(
    endpoint: EndpointInterface,
    ...rest: readonly [...unknown[], State<unknown>]
  ): ErrorTypes | undefined {
    if (rest[0] === null) return;
    const state = rest[rest.length - 1] as State<unknown>;
    // this is typescript generics breaking
    const args: any = rest.slice(0, rest.length - 1);
    const key = endpoint.key(...args);

    const meta = selectMeta(state, key);
    const error = state.endpoints[key];

    if (error !== undefined && meta?.errorPolicy === 'soft') return;

    return meta?.error as any;
  }

  /**
   * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
   * @see https://dataclient.io/docs/api/Controller#getResponse
   */
  getResponse<E extends EndpointInterface>(
    endpoint: E,
    ...rest:
      | readonly [null, State<unknown>]
      | readonly [...Parameters<E>, State<unknown>]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
    countRef: () => () => void;
  };

  getResponse<
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
  >(
    endpoint: E,
    ...rest: readonly [
      ...(readonly [...Parameters<E['key']>] | readonly [null]),
      State<unknown>,
    ]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
    countRef: () => () => void;
  };

  getResponse(
    endpoint: EndpointInterface,
    ...rest: readonly [...unknown[], State<unknown>]
  ): {
    data: unknown;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
    countRef: () => () => void;
  } {
    // TODO: breaking: only return data
    return this.getResponseMeta(endpoint, ...rest);
  }

  /**
   * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
   * @see https://dataclient.io/docs/api/Controller#getResponseMeta
   */
  getResponseMeta<E extends EndpointInterface>(
    endpoint: E,
    ...rest:
      | readonly [null, State<unknown>]
      | readonly [...Parameters<E>, State<unknown>]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
    countRef: () => () => void;
  };

  getResponseMeta<
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
  >(
    endpoint: E,
    ...rest: readonly [
      ...(readonly [...Parameters<E['key']>] | readonly [null]),
      State<unknown>,
    ]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
    countRef: () => () => void;
  };

  getResponseMeta(
    endpoint: EndpointInterface,
    ...rest: readonly [...unknown[], State<unknown>]
  ): {
    data: unknown;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
    countRef: () => () => void;
  } {
    const [state, args] = extractStateAndArgs(rest);
    const isActive = args.length !== 1 || args[0] !== null;
    const key = isActive ? endpoint.key(...args) : '';
    const cacheEndpoints = isActive ? state.endpoints[key] : undefined;
    const schema = endpoint.schema;
    const meta = selectMeta(state, key);
    let expiresAt = meta?.expiresAt;
    // if we have no endpoint entry, and our endpoint has a schema - try querying the store
    const shouldQuery = cacheEndpoints === undefined && schema !== undefined;

    const input =
      shouldQuery ?
        // nothing in endpoints cache, so try querying if we have a schema to do so
        this.memo.buildQueryKey(schema, args, state, key)
      : cacheEndpoints;

    if (!isActive) {
      // when not active simply return the query input without denormalizing
      return {
        data: input as any,
        expiryStatus: ExpiryStatus.Valid,
        expiresAt: Infinity,
        countRef: () => () => undefined,
      };
    }

    let isInvalid = false;
    if (shouldQuery) {
      isInvalid = !validateQueryKey(input);
      // endpoint without entities
    } else if (!schema || !schemaHasEntity(schema)) {
      return {
        data: cacheEndpoints,
        expiryStatus: this.getExpiryStatus(
          !cacheEndpoints,
          !!endpoint.invalidIfStale,
          meta,
        ),
        expiresAt: expiresAt || 0,
        countRef: this.gcPolicy.createCountRef({ key }),
      };
    }

    const { data, paths } = this.memo.denormalize(
      schema,
      input,
      state.entities,
      args,
    ) as { data: any; paths: EntityPath[] };

    if (!expiresAt) {
      // note: isInvalid can only be true if shouldQuery is true
      if (isInvalid) expiresAt = 1;
      // fallback to entity expiry time
      else expiresAt = entityExpiresAt(paths, state.entitiesMeta);
    }

    return {
      data,
      expiryStatus: this.getExpiryStatus(
        typeof data === 'symbol',
        !!endpoint.invalidIfStale || isInvalid,
        meta,
      ),
      expiresAt,
      countRef: this.gcPolicy.createCountRef({ key, paths }),
    };
  }

  /**
   * Queries the store for a Querable schema
   * @see https://dataclient.io/docs/api/Controller#get
   */
  get<S extends Queryable>(
    schema: S,
    ...rest: readonly [
      ...SchemaArgs<S>,
      Pick<State<unknown>, 'entities' | 'indexes'>,
    ]
  ): DenormalizeNullable<S> | undefined {
    const [state, args] = extractStateAndArgs(rest);

    const { data } = this.memo.query(schema, args, state);
    return typeof data === 'symbol' ? undefined : data;
  }

  /**
   * Queries the store for a Querable schema; providing related metadata
   * @see https://dataclient.io/docs/api/Controller#getQueryMeta
   */
  getQueryMeta<S extends Queryable>(
    schema: S,
    ...rest: readonly [
      ...SchemaArgs<S>,
      Pick<State<unknown>, 'entities' | 'indexes'>,
    ]
  ): {
    data: DenormalizeNullable<S> | undefined;
    countRef: () => () => void;
  } {
    const [state, args] = extractStateAndArgs(rest);

    const { data, paths } = this.memo.query(schema, args, state);

    return {
      data: typeof data === 'symbol' ? undefined : data,
      countRef: this.gcPolicy.createCountRef({ paths }),
    };
  }

  private getExpiryStatus(
    invalidData: boolean,
    invalidIfStale: boolean,
    meta: { error?: unknown; invalidated?: unknown } = {},
  ) {
    // https://dataclient.io/docs/concepts/expiry-policy#expiry-status
    // we don't track the difference between stale or fresh because that is tied to triggering
    // conditions
    return (
      meta.invalidated || (invalidData && !meta.error) ? ExpiryStatus.Invalid
      : invalidData || invalidIfStale ? ExpiryStatus.InvalidIfStale
      : ExpiryStatus.Valid
    );
  }
}

// benchmark: https://www.measurethat.net/Benchmarks/Show/24691/0/min-reducer-vs-imperative-with-paths
// earliest expiry dictates age
function entityExpiresAt(
  paths: EntityPath[],
  entitiesMeta: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly date: number;
        readonly expiresAt: number;
        readonly fetchedAt: number; // This is only the value until it is set by the DataProvider
      };
    };
  },
) {
  let expiresAt = Infinity;
  for (const { key, pk } of paths) {
    const entityExpiry = entitiesMeta[key]?.[pk]?.expiresAt;
    // expiresAt will always resolve to false with any comparison
    if (entityExpiry < expiresAt) expiresAt = entityExpiry;
  }
  return expiresAt;
}

/** Determine whether the schema has any entities.
 *
 * Without entities, denormalization is not needed, and results should not be queried.
 */
function schemaHasEntity(schema: Schema): boolean {
  if (isEntity(schema)) return true;
  if (Array.isArray(schema))
    return schema.length !== 0 && schemaHasEntity(schema[0]);
  if (schema && (typeof schema === 'object' || typeof schema === 'function')) {
    const nestedSchema =
      'schema' in schema ? (schema.schema as Record<string, Schema>) : schema;
    if (typeof nestedSchema === 'function') {
      return schemaHasEntity(nestedSchema);
    }
    return Object.values(nestedSchema).some(x => schemaHasEntity(x));
  }
  return false;
}

export type { ErrorTypes };

class Snapshot<T = unknown> implements SnapshotInterface {
  static readonly abort = new AbortOptimistic();

  private state: State<T>;
  private controller: Controller;
  readonly fetchedAt: number;
  readonly abort = Snapshot.abort;

  constructor(controller: Controller, state: State<T>, fetchedAt = 0) {
    this.state = state;
    this.controller = controller;
    this.fetchedAt = fetchedAt;
  }

  /*************** Data Access ***************/
  /** @see https://dataclient.io/docs/api/Snapshot#getResponse */
  getResponse<E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [null]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  };

  getResponse<E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  };

  getResponse<
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E['key']>] | readonly [null]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  };

  getResponse<
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E['key']>] | readonly [null]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  } {
    return this.controller.getResponse(endpoint, ...args, this.state);
  }

  /** @see https://dataclient.io/docs/api/Snapshot#getResponseMeta */
  getResponseMeta<E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [null]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  };

  getResponseMeta<E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  };

  getResponseMeta<
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E['key']>] | readonly [null]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  };

  getResponseMeta<
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E['key']>] | readonly [null]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  } {
    return this.controller.getResponseMeta(endpoint, ...args, this.state);
  }

  /** @see https://dataclient.io/docs/api/Snapshot#getError */
  getError<E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ): ErrorTypes | undefined;

  getError<E extends Pick<EndpointInterface, 'key'>>(
    endpoint: E,
    ...args: readonly [...Parameters<E['key']>] | readonly [null]
  ): ErrorTypes | undefined;

  getError<E extends Pick<EndpointInterface, 'key'>>(
    endpoint: E,
    ...args: readonly [...Parameters<E['key']>] | readonly [null]
  ): ErrorTypes | undefined {
    return this.controller.getError(endpoint, ...args, this.state);
  }

  /**
   * Retrieved memoized value for any Querable schema
   * @see https://dataclient.io/docs/api/Snapshot#get
   */
  get<S extends Queryable>(
    schema: S,
    ...args: SchemaArgs<S>
  ): DenormalizeNullable<S> | undefined {
    return this.controller.get(schema, ...args, this.state);
  }

  /**
   * Queries the store for a Querable schema; providing related metadata
   * @see https://dataclient.io/docs/api/Snapshot#getQueryMeta
   */
  getQueryMeta<S extends Queryable>(
    schema: S,
    ...args: SchemaArgs<S>
  ): {
    data: DenormalizeNullable<S> | undefined;
    countRef: () => () => void;
  } {
    return this.controller.getQueryMeta(schema, ...args, this.state);
  }
}

/** Extract state and args from rest params, applying ensurePojo to args */
function extractStateAndArgs(rest: readonly unknown[]): [State<any>, any[]] {
  const l = rest.length;
  const args: any = new Array(l - 1);
  for (let i = 0; i < l - 1; i++) {
    // handle FormData
    args[i] = ensurePojo(rest[i]);
  }
  // this is typescript generics breaking
  return [rest[l - 1] as State<any>, args];
}
