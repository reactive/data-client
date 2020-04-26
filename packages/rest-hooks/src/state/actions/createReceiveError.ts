import { Schema } from 'rest-hooks/resource';
import { FetchAction, ResponseActions } from 'rest-hooks/types';

export default function createReceiveError<S extends Schema = any>(
  error: any,
  { schema, key, responseType, options = {} }: FetchAction<any, S>['meta'],
  { errorExpiryLength }: { errorExpiryLength: number },
): ResponseActions {
  const expiryLength = options.errorExpiryLength ?? errorExpiryLength;
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && expiryLength < 0) {
    throw new Error('Negative errorExpiryLength are not allowed.');
  }
  const now = Date.now();
  return {
    type: responseType as any,
    payload: error,
    meta: {
      schema,
      key,
      date: now,
      expiresAt: now + expiryLength,
    },
    error: true,
  };
}
