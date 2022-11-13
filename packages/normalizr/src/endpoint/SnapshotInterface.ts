import type { ExpiryStatusInterface } from '../Expiry.js';
import type { EndpointInterface } from './EndpointInterface.js';
import type { ErrorTypes } from './ErrorTypes.js';

export interface SnapshotInterface {
  getResponse: <
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
    Args extends readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...args: Args
  ) => {
    data: any;
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
