import type { ActionTypes, State } from '@rest-hooks/core/types';
import type {
  EndpointInterface,
  FetchFunction,
  ResolveType,
} from '@rest-hooks/endpoint';
import createInvalidate from '@rest-hooks/core/controller/createInvalidate';
import createFetch from '@rest-hooks/core/controller/createFetch';
import createReset from '@rest-hooks/core/controller/createReset';
import { selectMeta } from '@rest-hooks/core/state/selectors/index';
import createReceive from '@rest-hooks/core/controller/createReceive';
import { NetworkError, UnknownError } from '@rest-hooks/core/types';
import { ExpiryStatus } from '@rest-hooks/core/controller/Expiry';
import {
  createUnsubscription,
  createSubscription,
} from '@rest-hooks/core/controller/createSubscription';
import type { EndpointUpdateFunction } from '@rest-hooks/core/controller/types';
import {
  denormalize,
  DenormalizeCache,
  DenormalizeNullable,
  isEntity,
  Schema,
  WeakListMap,
} from '@rest-hooks/normalizr';
import { inferResults } from '@rest-hooks/normalizr';
import { unsetDispatch } from '@rest-hooks/use-enhanced-reducer';

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
    ...args: readonly [...Parameters<E>] | readonly [null]
  ): Promise<void>
  */

  getError = <E extends Pick<EndpointInterface, 'key'>>(
    endpoint: E,
    ...rest:
      | readonly [...Parameters<E['key']>, State<unknown>]
      | readonly [null, State<unknown>]
  ): ErrorTypes | undefined => {
    const state = rest[rest.length - 1] as State<unknown>;
    const args = rest.slice(0, rest.length - 1) as Parameters<E['key']>;
    if (args?.[0] === null) return;
    const key = endpoint.key(...args);

    const meta = selectMeta(state, key);
    const results = state.results[key];

    if (results !== undefined && meta?.errorPolicy === 'soft') return;

    return meta?.error as any;
  };

  getResponse = <
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
  >(
    endpoint: E,
    ...rest:
      | readonly [...Parameters<E['key']>, State<unknown>]
      | readonly [null, State<unknown>]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  } => {
    const state = rest[rest.length - 1] as State<unknown>;
    const args = rest.slice(0, rest.length - 1) as Parameters<E['key']>;
    const activeArgs = args?.[0] !== null;
    const key = activeArgs ? endpoint.key(...args) : '';
    const cacheResults = activeArgs && state.results[key];
    const schema = endpoint.schema;
    const meta = selectMeta(state, key);
    let expiresAt = meta?.expiresAt;

    const results = this.getResults(
      endpoint.schema,
      cacheResults,
      args,
      state.indexes,
    );

    if (!endpoint.schema || !schemaHasEntity(endpoint.schema)) {
      return {
        data: results,
        expiryStatus: meta?.invalidated
          ? ExpiryStatus.Invalid
          : cacheResults
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
          `fetch key ${key} has object results when single result is expected`,
        );
      }
    }

    if (activeArgs && !this.globalCache.results[key])
      this.globalCache.results[key] = new WeakListMap();

    // second argument is false if any entities are missing
    // eslint-disable-next-line prefer-const
    const [data, found, suspend, resolvedEntities] = denormalize(
      results,
      schema,
      state.entities,
      this.globalCache.entities,
      activeArgs ? this.globalCache.results[key] : undefined,
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
              state.entityMeta[key][pk].expiresAt,
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
  ) => {
    if (cacheResults || schema === undefined) return cacheResults;

    return inferResults(schema, args, indexes);
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

export type ErrorTypes = NetworkError | UnknownError;
