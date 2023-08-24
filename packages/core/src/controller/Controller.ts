import type {
  ErrorTypes,
  SnapshotInterface,
  DenormalizeCache,
  Schema,
  Denormalize,
} from '@data-client/normalizr';
import {
  WeakEntityMap,
  ExpiryStatus,
  EndpointInterface,
  FetchFunction,
  ResolveType,
  DenormalizeNullable,
  Path,
  denormalizeCached,
  isEntity,
  denormalize,
} from '@data-client/normalizr';
import { inferResults, validateInference } from '@data-client/normalizr';

import createExpireAll from './createExpireAll.js';
import createFetch from './createFetch.js';
import createInvalidate from './createInvalidate.js';
import createInvalidateAll from './createInvalidateAll.js';
import createReset from './createReset.js';
import createSet from './createSet.js';
import {
  createUnsubscription,
  createSubscription,
} from './createSubscription.js';
import ensurePojo from './ensurePojo.js';
import type { EndpointUpdateFunction } from './types.js';
import { initialState } from '../state/reducer/createReducer.js';
import selectMeta from '../state/selectMeta.js';
import type { ActionTypes, State } from '../types.js';

export type GenericDispatch = (value: any) => Promise<void>;
export type DataClientDispatch = (value: ActionTypes) => Promise<void>;

interface ConstructorProps<D extends GenericDispatch = DataClientDispatch> {
  dispatch?: D;
  getState?: () => State<unknown>;
  globalCache?: DenormalizeCache;
}

const unsetDispatch = (action: unknown): Promise<void> => {
  throw new Error(
    `Dispatching while constructing your middleware is not allowed. ` +
      `Other middleware would not be applied to this dispatch.`,
  );
};
const unsetState = (): State<unknown> => {
  // This is only the value until it is set by the CacheProvider
  /* istanbul ignore next */
  return initialState;
};

/**
 * Imperative control of Rest Hooks store
 * @see https://resthooks.io/docs/api/Controller
 */
export default class Controller<
  D extends GenericDispatch = DataClientDispatch,
> {
  /**
   * Dispatches an action to Rest Hooks reducer.
   *
   * @see https://resthooks.io/docs/api/Controller#dispatch
   */
  declare readonly dispatch: D;
  /**
   * Gets the latest state snapshot that is fully committed.
   *
   * This can be useful for imperative use-cases like event handlers.
   * This should *not* be used to render; instead useSuspense() or useCache()
   * @see https://resthooks.io/docs/api/Controller#getState
   */
  declare readonly getState: () => State<unknown>;
  declare readonly globalCache: DenormalizeCache;

  constructor({
    dispatch = unsetDispatch as any,
    getState = unsetState,
    globalCache = {
      entities: {},
      results: {},
    },
  }: ConstructorProps<D> = {}) {
    this.dispatch = dispatch;
    this.getState = getState;
    this.globalCache = globalCache;
  }

  /*************** Action Dispatchers ***************/

  /**
   * Fetches the endpoint with given args, updating the Rest Hooks cache with the response or error upon completion.
   * @see https://resthooks.io/docs/api/Controller#fetch
   */
  fetch = <
    E extends EndpointInterface & { update?: EndpointUpdateFunction<E> },
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ): E['schema'] extends undefined | null
    ? ReturnType<E>
    : Promise<Denormalize<E['schema']>> => {
    const action = createFetch(endpoint, {
      args,
    });
    this.dispatch(action);

    if (endpoint.schema) {
      return action.meta.promise.then(input =>
        denormalize(input, endpoint.schema, {}, args),
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
  ): E['schema'] extends undefined | null
    ? ReturnType<E> | ResolveType<E>
    : Promise<Denormalize<E['schema']>> | Denormalize<E['schema']> => {
    const { data, expiresAt, expiryStatus } = this.getResponse(
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
   * @see https://resthooks.io/docs/api/Controller#invalidate
   */
  invalidate = <E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ): Promise<void> =>
    args[0] !== null
      ? this.dispatch(
          createInvalidate(endpoint, {
            args: args as readonly [...Parameters<E>],
          }),
        )
      : Promise.resolve();

  /**
   * Forces refetching and suspense on useSuspense on all matching endpoint result keys.
   * @see https://resthooks.io/docs/api/Controller#invalidateAll
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
   * Resets the entire Rest Hooks cache. All inflight requests will not resolve.
   * @see https://resthooks.io/docs/api/Controller#resetEntireStore
   */
  resetEntireStore = (): Promise<void> => this.dispatch(createReset());

  /**
   * Stores response in cache for given Endpoint and args.
   * @see https://resthooks.io/docs/api/Controller#set
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
    const action = createSet(endpoint, {
      args: rest.slice(0, rest.length - 1) as Parameters<E>,
      response,
    });
    return this.dispatch(action);
  };

  /**
   * @deprecated use https://resthooks.io/docs/api/Controller#setResponse instead
   */
  /* istanbul ignore next */ receive = <
    E extends EndpointInterface & {
      update?: EndpointUpdateFunction<E>;
    },
  >(
    endpoint: E,
    ...rest: readonly [...Parameters<E>, any]
  ): Promise<void> => {
    /* istanbul ignore next */
    return this.setResponse(endpoint, ...rest);
  };

  /**
   * Stores the result of Endpoint and args as the error provided.
   * @see https://resthooks.io/docs/api/Controller#setError
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
    const action = createSet(endpoint, {
      args: rest.slice(0, rest.length - 1) as Parameters<E>,
      response,
      error: true,
    });
    return this.dispatch(action);
  };

  /**
   * Another name for setError
   * @deprecated use https://resthooks.io/docs/api/Controller#setError instead
   */
  /* istanbul ignore next */ receiveError = <
    E extends EndpointInterface & {
      update?: EndpointUpdateFunction<E>;
    },
  >(
    endpoint: E,
    ...rest: readonly [...Parameters<E>, Error]
  ): Promise<void> => {
    /* istanbul ignore next */
    return this.setError(endpoint, ...rest);
  };

  /**
   * Resolves an inflight fetch. `fetchedAt` should `fetch`'s `createdAt`
   * @see https://resthooks.io/docs/api/Controller#resolve
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
          error?: false;
        },
  ): Promise<void> => {
    return this.dispatch(createSet(endpoint, meta as any));
  };

  /**
   * Marks a new subscription to a given Endpoint.
   * @see https://resthooks.io/docs/api/Controller#subscribe
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
    args[0] !== null
      ? this.dispatch(
          createSubscription(endpoint, {
            args: args as readonly [...Parameters<E>],
          }),
        )
      : Promise.resolve();

  /**
   * Marks completion of subscription to a given Endpoint.
   * @see https://resthooks.io/docs/api/Controller#unsubscribe
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
    args[0] !== null
      ? this.dispatch(
          createUnsubscription(endpoint, {
            args: args as readonly [...Parameters<E>],
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
   * Gets a snapshot (https://resthooks.io/docs/api/Snapshot)
   * @see https://resthooks.io/docs/api/Controller#snapshot
   */
  snapshot = (state: State<unknown>, fetchedAt?: number): SnapshotInterface => {
    return new Snapshot(this, state, fetchedAt);
  };

  /**
   * Gets the error, if any, for a given endpoint. Returns undefined for no errors.
   * @see https://resthooks.io/docs/api/Controller#getError
   */
  getError = <
    E extends Pick<EndpointInterface, 'key'>,
    Args extends readonly [...Parameters<E['key']>] | readonly [null],
  >(
    endpoint: E,
    ...rest: [...Args, State<unknown>]
  ): ErrorTypes | undefined => {
    if (rest[0] === null) return;
    const state = rest[rest.length - 1] as State<unknown>;
    // this is typescript generics breaking
    const args: any = rest.slice(0, rest.length - 1) as Parameters<E['key']>;
    const key = endpoint.key(...args);

    const meta = selectMeta(state, key);
    const results = state.results[key];

    if (results !== undefined && meta?.errorPolicy === 'soft') return;

    return meta?.error as any;
  };

  /**
   * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
   * @see https://resthooks.io/docs/api/Controller#getResponse
   */
  getResponse = <
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
    Args extends readonly [...Parameters<E['key']>] | readonly [null],
  >(
    endpoint: E,
    ...rest: [...Args, State<unknown>]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  } => {
    const state = rest[rest.length - 1] as State<unknown>;
    // this is typescript generics breaking
    const args: any = rest
      .slice(0, rest.length - 1)
      .map(ensurePojo) as Parameters<E['key']>;
    const isActive = args.length !== 1 || args[0] !== null;
    const key = isActive ? endpoint.key(...args) : '';
    const cacheResults = isActive ? state.results[key] : undefined;
    const schema = endpoint.schema;
    const meta = selectMeta(state, key);
    let expiresAt = meta?.expiresAt;

    let invalidResults = false;
    let results;
    if (cacheResults === undefined && endpoint.schema !== undefined) {
      results = inferResults(
        endpoint.schema,
        args,
        state.indexes,
        state.entities,
      );
      invalidResults = !validateInference(results);
      if (!expiresAt && invalidResults) expiresAt = 1;
    } else {
      results = cacheResults;
    }

    if (!isActive) {
      return {
        data: results as any,
        expiryStatus: ExpiryStatus.Valid,
        expiresAt: Infinity,
      };
    }

    if (!endpoint.schema || !schemaHasEntity(endpoint.schema)) {
      return {
        data: results,
        expiryStatus: meta?.invalidated
          ? ExpiryStatus.Invalid
          : cacheResults && !endpoint.invalidIfStale
          ? ExpiryStatus.Valid
          : ExpiryStatus.InvalidIfStale,
        expiresAt: expiresAt || 0,
      } as {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatus;
        expiresAt: number;
      };
    }

    if (!this.globalCache.results[key])
      this.globalCache.results[key] = new WeakEntityMap();

    // second argument is false if any entities are missing
    // eslint-disable-next-line prefer-const
    const { data, paths } = denormalizeCached(
      results,
      schema,
      state.entities,
      this.globalCache.entities,
      this.globalCache.results[key],
      args,
    ) as { data: DenormalizeNullable<E['schema']>; paths: Path[] };
    const invalidDenormalize = typeof data === 'symbol';

    // fallback to entity expiry time
    if (!expiresAt) {
      expiresAt = entityExpiresAt(paths, state.entityMeta);
    }

    // https://resthooks.io/docs/concepts/expiry-policy#expiry-status
    // we don't track the difference between stale or fresh because that is tied to triggering
    // conditions
    const expiryStatus =
      meta?.invalidated || (invalidDenormalize && !meta?.error)
        ? ExpiryStatus.Invalid
        : invalidDenormalize || endpoint.invalidIfStale || invalidResults
        ? ExpiryStatus.InvalidIfStale
        : ExpiryStatus.Valid;

    return { data, expiryStatus, expiresAt };
  };
}

// benchmark: https://www.measurethat.net/Benchmarks/Show/24691/0/min-reducer-vs-imperative-with-paths
// earliest expiry dictates age
function entityExpiresAt(
  paths: Path[],
  entityMeta: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly date: number;
        readonly expiresAt: number;
        readonly fetchedAt: number; // This is only the value until it is set by the CacheProvider
      };
    };
  },
) {
  let expiresAt = Infinity;
  for (const { pk, key } of paths) {
    const entityExpiry = entityMeta[key]?.[pk]?.expiresAt;
    // expiresAt will always resolve to false with any comparison
    if (entityExpiry < expiresAt) expiresAt = entityExpiry;
  }
  return expiresAt;
}

/** Determine whether the schema has any entities.
 *
 * Without entities, denormalization is not needed, and results should not be inferred.
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
  private state: State<T>;
  private controller: Controller;
  readonly fetchedAt: number;

  constructor(controller: Controller, state: State<T>, fetchedAt = 0) {
    this.state = state;
    this.controller = controller;
    this.fetchedAt = fetchedAt;
  }

  /*************** Data Access ***************/
  /** @see https://resthooks.io/docs/api/Snapshot#getResponse */
  getResponse = <
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
    Args extends readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...args: Args
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  } => {
    return this.controller.getResponse(endpoint, ...args, this.state);
  };

  /** @see https://resthooks.io/docs/api/Snapshot#getError */
  getError = <
    E extends Pick<EndpointInterface, 'key'>,
    Args extends readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...args: Args
  ): ErrorTypes | undefined => {
    return this.controller.getError(endpoint, ...args, this.state);
  };
}
