import { FetchAction, ReceiveAction } from '@rest-hooks/core/types';
import { RECEIVE_TYPE } from '@rest-hooks/core/actionTypes';
import { EndpointInterface, FetchFunction } from '@rest-hooks/endpoint';

export default function createReceiveError<
  E extends EndpointInterface<FetchFunction, any, any> = EndpointInterface<
    FetchFunction,
    any,
    any
  >
>(
  error: Error,
  {
    endpoint,
    args,
  }: Pick<FetchAction<E>, 'args'> & {
    endpoint: Pick<FetchAction<E>['endpoint'], 'schema' | 'key'> & {
      errorExpiryLength: number;
    };
  },
): ReceiveAction<Error, E['schema']> {
  /* istanbul ignore next */
  if (
    process.env.NODE_ENV === 'development' &&
    endpoint.errorExpiryLength < 0
  ) {
    throw new Error('Negative errorExpiryLength are not allowed.');
  }
  const now = Date.now();
  return {
    type: RECEIVE_TYPE,
    payload: error,
    meta: {
      schema: endpoint.schema,
      key: endpoint.key(args[0]),
      date: now,
      expiresAt: now + endpoint.errorExpiryLength,
    },
    error: true,
  };
}
