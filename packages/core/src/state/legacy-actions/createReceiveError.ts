import {
  Schema,
  EndpointExtraOptions as FetchOptions,
} from '@rest-hooks/normalizr';

import { FetchAction, ReceiveAction } from '../../types.js';
import { RECEIVE_TYPE } from '../../actionTypes.js';

interface Options<S extends Schema | undefined = any>
  extends Pick<FetchAction<any, S>['meta'], 'schema' | 'key' | 'options'> {
  errorExpiryLength: NonNullable<FetchOptions['errorExpiryLength']>;
  fetchedAt?: number;
}

export default function createReceiveError<S extends Schema | undefined = any>(
  error: Error,
  { schema, key, options, errorExpiryLength, fetchedAt = 0 }: Options<S>,
): ReceiveAction {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && errorExpiryLength < 0) {
    throw new Error('Negative errorExpiryLength are not allowed.');
  }
  const now = Date.now();
  return {
    type: RECEIVE_TYPE,
    payload: error,
    meta: {
      schema,
      key,
      date: now,
      fetchedAt,
      expiresAt: now + errorExpiryLength,
      errorPolicy: options?.errorPolicy,
    },
    error: true,
  };
}
