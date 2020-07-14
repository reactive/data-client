import { FetchAction, ReceiveAction } from '@rest-hooks/core/types';
import { RECEIVE_TYPE } from '@rest-hooks/core/actionTypes';
import { EndpointInterface, FetchFunction } from '@rest-hooks/endpoint';

/** Update state with data
 *
 * @param data
 * @param fetchAction { endpoint, args, meta }
 */
export default function createReceive<
  E extends EndpointInterface<FetchFunction, any, any> = EndpointInterface<
    FetchFunction,
    any,
    any
  >,
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null
>(
  data: Payload,
  {
    endpoint,
    args,
    meta: { updaters },
  }: Pick<FetchAction<E>, 'args' | 'meta'> & {
    endpoint: Pick<FetchAction<E>['endpoint'], 'schema' | 'key'> & {
      dataExpiryLength: number;
    };
  },
): ReceiveAction<Payload, E['schema']> {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && endpoint.dataExpiryLength < 0) {
    throw new Error('Negative dataExpiryLength are not allowed.');
  }
  const now = Date.now();
  const meta: ReceiveAction['meta'] = {
    schema: endpoint.schema,
    key: endpoint.key(args[0]),
    date: now,
    expiresAt: now + endpoint.dataExpiryLength,
  };
  meta.updaters = updaters;
  return {
    type: RECEIVE_TYPE,
    payload: data,
    meta,
  };
}
