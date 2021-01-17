import { Schema } from '@rest-hooks/endpoint';
import {
  FetchAction,
  ReceiveAction,
  FetchOptions,
} from '@rest-hooks/core/types';
import { RECEIVE_TYPE } from '@rest-hooks/core/actionTypes';

interface Options<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema = any
> extends Pick<
    FetchAction<Payload, S>['meta'],
    'schema' | 'key' | 'type' | 'updaters'
  > {
  dataExpiryLength: NonNullable<FetchOptions['dataExpiryLength']>;
}

/** Update state with data
 *
 * @param data
 * @param param1 { schema, key, type, updaters, dataExpiryLength }
 */
export default function createReceive<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema = any
>(
  data: Payload,
  { schema, key, updaters, dataExpiryLength }: Options<Payload, S>,
): ReceiveAction<Payload, S> {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && dataExpiryLength < 0) {
    throw new Error('Negative dataExpiryLength are not allowed.');
  }
  const now = Date.now();
  const meta: ReceiveAction['meta'] = {
    schema,
    key,
    date: now,
    expiresAt: now + dataExpiryLength,
  };
  meta.updaters = updaters;
  return {
    type: RECEIVE_TYPE,
    payload: data,
    meta,
  };
}
