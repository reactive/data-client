import type {
  DenormalizeNullable,
  EndpointInterface,
  ErrorTypes,
  ExpiryStatus,
  Queryable,
  SchemaArgs,
  SnapshotInterface,
} from '@data-client/normalizr';

import AbortOptimistic from './AbortOptimistic.js';
import type Controller from './Controller.js';
import type { State } from '../types.js';

/** Reads `state` the way the Controller getters do
 * @see https://dataclient.io/docs/api/Snapshot
 */
export default class Snapshot<T = unknown> implements SnapshotInterface {
  static readonly abort = new AbortOptimistic();

  declare private state: State<T>;
  declare private controller: Controller;
  declare readonly fetchedAt: number;
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
    ...args: SchemaArgs<S> | readonly [null]
  ): DenormalizeNullable<S> | undefined {
    return this.controller.get(schema, ...args, this.state);
  }

  /**
   * Queries the store for a Querable schema; providing related metadata
   * @see https://dataclient.io/docs/api/Snapshot#getQueryMeta
   */
  getQueryMeta<S extends Queryable>(
    schema: S,
    ...args: SchemaArgs<S> | readonly [null]
  ): {
    data: DenormalizeNullable<S> | undefined;
    countRef: () => () => void;
  } {
    return this.controller.getQueryMeta(schema, ...args, this.state);
  }
}
