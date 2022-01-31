import type { DenormalizeNullable } from '@rest-hooks/endpoint/normal';
import type { EndpointInterface } from '@rest-hooks/endpoint/interface';
import type { ExpiryStatus } from '@rest-hooks/endpoint/Expiry';
import type { ErrorTypes } from '@rest-hooks/endpoint/ErrorTypes';

export default interface SnapshotInterface {
  getResponse: <
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
  >(
    endpoint: E,
    ...args: readonly [...Parameters<E['key']>] | readonly [null]
  ) => {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatus;
    expiresAt: number;
  };

  getError: <E extends Pick<EndpointInterface, 'key'>>(
    endpoint: E,
    ...args: readonly [...Parameters<E['key']>] | readonly [null]
  ) => ErrorTypes | undefined;

  readonly fetchedAt: number;
}
