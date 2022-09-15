import type { DenormalizeNullable } from '../types.js';
import type { EndpointInterface } from './EndpointInterface.js';
import type { ErrorTypes } from './ErrorTypes.js';
import type { ExpiryStatusInterface } from '../Expiry.js';

export interface SnapshotInterface {
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
