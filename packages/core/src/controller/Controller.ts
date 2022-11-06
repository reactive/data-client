import type {
  EndpointInterface,
  FetchFunction,
  ResolveType,
  DenormalizeNullable,
  EntityTable,
} from '@rest-hooks/normalizr';
import { ExpiryStatus } from '@rest-hooks/normalizr';
import {
  ErrorTypes,
  SnapshotInterface,
  denormalize,
  DenormalizeCache,
  isEntity,
  Schema,
  WeakListMap,
} from '@rest-hooks/normalizr';
import { inferResults } from '@rest-hooks/normalizr';
import { unsetDispatch } from '@rest-hooks/use-enhanced-reducer';

import type { EndpointUpdateFunction } from './types.js';
import {
  createUnsubscription,
  createSubscription,
} from './createSubscription.js';
import createReceive from './createReceive.js';
import createReset from './createReset.js';
import createFetch from './createFetch.js';
import createInvalidate from './createInvalidate.js';
import selectMeta from '../state/selectors/selectMeta.js';
import type { ActionTypes, State } from '../types.js';
import { initialState } from '../state/createReducer.js';

type RHDispatch = (value: ActionTypes) => Promise<void>;

interface ConstructorProps {
  dispatch?: RHDispatch;
  globalCache?: DenormalizeCache;
}

/**
 * Imperative control of Rest Hooks store
 * @see https://resthooks.io/docs/api/Controller
 */
export default class Controller {
  declare readonly dispatch: RHDispatch;
  declare readonly globalCache: DenormalizeCache;

  constructor({
    dispatch = unsetDispatch,
    globalCache = {
      entities: {},
      results: {},
    },
  }: ConstructorProps = {}) {
    this.dispatch = dispatch;
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
  ): ReturnType<E> => {
    const action = createFetch(endpoint, {
      args,
    });
    this.dispatch(action);

    return action.meta.promise as ReturnType<E>;
  };

  /**
   * Forces refetching and suspense on useResource with the same Endpoint and parameters.
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
   * Resets the entire Rest Hooks cache. All inflight requests will not resolve.
   * @see https://resthooks.io/docs/api/Controller#resetEntireStore
   */
  resetEntireStore = (): Promise<void> => this.dispatch(createReset());

  /**
   * Stores response in cache for given Endpoint and args.
   * @see https://resthooks.io/docs/api/Controller#receive
   */
  receive = <
    E extends EndpointInterface & {
      update?: EndpointUpdateFunction<E>;
    },
  >(
    endpoint: E,
    ...rest: readonly [...Parameters<E>, any]
  ): Promise<void> => {
    const response: ResolveType<E> = rest[rest.length - 1];
    const action = createReceive(endpoint, {
      args: rest.slice(0, rest.length - 1) as Parameters<E>,
      response,
    });
    return this.dispatch(action);
  };

  /**
   * Stores the result of Endpoint and args as the error provided.
   * @see https://resthooks.io/docs/api/Controller#receiveError
   */
  receiveError = <
    E extends EndpointInterface & {
      update?: EndpointUpdateFunction<E>;
    },
  >(
    endpoint: E,
    ...rest: readonly [...Parameters<E>, Error]
  ): Promise<void> => {
    const response: Error = rest[rest.length - 1];
    const action = createReceive(endpoint, {
      args: rest.slice(0, rest.length - 1) as Parameters<E>,
      response,
      error: true,
    });
    return this.dispatch(action);
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
    return this.dispatch(createReceive(endpoint, meta as any));
  };

  /**
   * Marks a new subscription to a given Endpoint.
   * @see https://resthooks.io/docs/api/Controller#subscribe
   */
  subscribe = <
    E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
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
    E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
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
   * Gets the latest state snapshot that is fully committed.
   *
   * This can be useful for imperative use-cases like event handlers.
   * This should *not* be used to render; instead useSuspense() or useCache()
   * @see https://resthooks.io/docs/api/Controller#getState
   */
  getState = (): State<unknown> => {
    // This is only the value until it is set by the CacheProvider
    /* istanbul ignore next */
    return initialState;
  };

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
    const args: any = rest.slice(0, rest.length - 1) as Parameters<E['key']>;
    const isActive = args.length !== 1 || args[0] !== null;
    const key = isActive ? endpoint.key(...args) : '';
    const cacheResults = isActive && state.results[key];
    const schema = endpoint.schema;
    const meta = selectMeta(state, key);
    let expiresAt = meta?.expiresAt;

    const results = this.getResults(
      endpoint.schema,
      cacheResults,
      args,
      state.indexes,
      state.entities,
    );

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
    // Warn users with bad configurations
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'production' && schema && isEntity(schema)) {
      if (Array.isArray(results)) {
        throw new Error(
          `fetch key ${key} has list results when single result is expected`,
        );
      }
      if (typeof results === 'object') {
        throw new Error(
          `fetch key ${key} has object results when entity's primary key (string) result is expected`,
        );
      }
    }

    if (isActive && !this.globalCache.results[key])
      this.globalCache.results[key] = new WeakListMap();

    // second argument is false if any entities are missing
    // eslint-disable-next-line prefer-const
    const [data, found, suspend, resolvedEntities] = denormalize(
      results,
      schema,
      state.entities,
      this.globalCache.entities,
      isActive ? this.globalCache.results[key] : undefined,
    ) as [
      DenormalizeNullable<E['schema']>,
      boolean,
      boolean,
      Record<string, Record<string, any>>,
    ];

    // fallback to entity expiry time
    if (!expiresAt) {
      // expiresAt existance is equivalent to cacheResults
      if (found) {
        // oldest entity dictates age
        expiresAt = Infinity;
        // using Object.keys ensures we don't hit `toString` type members
        Object.entries(resolvedEntities).forEach(([key, entities]) =>
          Object.keys(entities).forEach(pk => {
            expiresAt = Math.min(
              expiresAt,
              state.entityMeta[key]?.[pk]?.expiresAt ?? Infinity,
            );
          }),
        );
      } else {
        expiresAt = 0;
      }
    }

    // https://resthooks.io/docs/getting-started/expiry-policy#expiry-status
    // we don't track the difference between stale or fresh because that is tied to triggering
    // conditions
    const expiryStatus =
      meta?.invalidated || (suspend && !meta?.error)
        ? ExpiryStatus.Invalid
        : suspend || endpoint.invalidIfStale || (!cacheResults && !found)
        ? ExpiryStatus.InvalidIfStale
        : ExpiryStatus.Valid;

    return { data, expiryStatus, expiresAt };
  };

  private getResults = (
    schema: Schema | undefined,
    cacheResults: any,
    args: any[],
    indexes: any,
    entities: EntityTable,
  ) => {
    if (cacheResults || schema === undefined) return cacheResults;

    return inferResults(schema, args, indexes, entities);
  };
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
