import { Schema } from '@rest-hooks/normalizr';
import {
  FetchAction,
  ReceiveAction,
  FetchOptions,
  PurgeAction,
} from '@rest-hooks/core/types';

import SHAPE_TYPE_TO_RESPONSE_TYPE from './responseTypeMapping';

interface Options<S extends Schema = any>
  extends Pick<FetchAction<any, S>['meta'], 'schema' | 'key' | 'type'> {
  errorExpiryLength: NonNullable<FetchOptions['errorExpiryLength']>;
}

export default function createReceiveError<S extends Schema = any>(
  error: any,
  { schema, key, type, errorExpiryLength }: Options<S>,
): typeof type extends 'delete' ? PurgeAction : ReceiveAction {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && errorExpiryLength < 0) {
    throw new Error('Negative errorExpiryLength are not allowed.');
  }
  const now = Date.now();
  return {
    type: (SHAPE_TYPE_TO_RESPONSE_TYPE[type] as any) || type,
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
