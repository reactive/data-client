import type { DenormalizeNullable } from './normal.js';
import type { EndpointInterface } from './interface.js';
import type { ExpiryStatusInterface } from './Expiry.js';
import type { ErrorTypes } from './ErrorTypes.js';

export default interface SnapshotInterface {
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
