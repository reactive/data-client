import type { ErrorTypes } from './ErrorTypes.js';
import type { EndpointInterface, Queryable } from './interface.js';
import type { DenormalizeNullable, SchemaArgs } from './normal.js';

export interface SnapshotInterface {
  readonly fetchedAt: number;
  readonly abort: Error;

  /**
   * Gets the (globally referentially stable) response for a given endpoint/args pair from state given.
   * @see https://dataclient.io/docs/api/Snapshot#getResponse
   */
  getResponse<E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [null]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatusInterface;
    expiresAt: number;
  };

  getResponse<E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatusInterface;
    expiresAt: number;
  };

  getResponse<
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E['key']>] | readonly [null]
  ): {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatusInterface;
    expiresAt: number;
  };

  /** @see https://dataclient.io/docs/api/Snapshot#getError */
  getError<E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ): ErrorTypes | undefined;

  getError<E extends Pick<EndpointInterface, 'key'>>(
    endpoint: E,
    ...args: readonly [...Parameters<E['key']>] | readonly [null]
  ): ErrorTypes | undefined;

  /**
   * Retrieved memoized value for any Querable schema
   * @see https://dataclient.io/docs/api/Snapshot#get
   */
  get<S extends Queryable>(
    schema: S,
    ...args: SchemaArgs<S>
  ): DenormalizeNullable<S> | undefined;
}

// looser version to allow for cross-package version compatibility
export type ExpiryStatusInterface = 1 | 2 | 3;
