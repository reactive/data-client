import type { DenormalizeNullable } from '@rest-hooks/endpoint/normal';
import type { EndpointInterface } from '@rest-hooks/endpoint/interface';
import type { ExpiryStatusInterface } from '@rest-hooks/endpoint/Expiry';
import type { ErrorTypes } from '@rest-hooks/endpoint/ErrorTypes';

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
