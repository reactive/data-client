import {
  Schema,
  EndpointExtraOptions as FetchOptions,
} from '@rest-hooks/normalizr';

import { RECEIVE_TYPE } from '../../actionTypes.js';
import { FetchAction, ReceiveAction } from '../../legacyActions.js';

interface Options<S extends Schema | undefined = any>
  extends Pick<FetchAction<any, S>['meta'], 'schema' | 'key' | 'options'> {
  errorExpiryLength?: NonNullable<FetchOptions['errorExpiryLength']>;
  fetchedAt?: number;
}

export default function createReceiveError<S extends Schema | undefined = any>(
  error: Error,
  {
    schema,
    key,
    options,
    errorExpiryLength = 60000,
    fetchedAt = 0,
  }: Options<S>,
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
