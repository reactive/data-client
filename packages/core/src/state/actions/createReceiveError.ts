import { Schema } from '@rest-hooks/normalizr';
import {
  FetchAction,
  ReceiveAction,
  FetchOptions,
} from '@rest-hooks/core/types';
import { RECEIVE_TYPE } from '@rest-hooks/core/actionTypes';

interface Options<S extends Schema = any>
  extends Pick<FetchAction<any, S>['meta'], 'schema' | 'key' | 'type'> {
  errorExpiryLength: NonNullable<FetchOptions['errorExpiryLength']>;
}

export default function createReceiveError<S extends Schema = any>(
  error: Error,
  { schema, key, errorExpiryLength }: Options<S>,
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
      expiresAt: now + errorExpiryLength,
    },
    error: true,
  };
}
