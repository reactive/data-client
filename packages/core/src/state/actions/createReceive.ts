import type {
  Schema,
  EndpointExtraOptions as FetchOptions,
} from '@rest-hooks/normalizr';

import { FetchAction, ReceiveAction } from '../../types.js';
import { RECEIVE_TYPE } from '../../actionTypes.js';

interface Options<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any,
> extends Pick<
    FetchAction<Payload, S>['meta'],
    'schema' | 'key' | 'type' | 'updaters' | 'update' | 'args'
  > {
  dataExpiryLength: NonNullable<FetchOptions['dataExpiryLength']>;
  fetchedAt?: number;
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
  S extends Schema | undefined = any,
>(
  data: Payload,
  {
    schema,
    key,
    args,
    updaters,
    fetchedAt = 0,
    update,
    dataExpiryLength,
  }: Options<Payload, S>,
): ReceiveAction<Payload, S> {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && dataExpiryLength < 0) {
    throw new Error('Negative dataExpiryLength are not allowed.');
  }
  const now = Date.now();
  const meta: ReceiveAction['meta'] = {
    schema,
    key,
    args,
    date: now,
    fetchedAt,
    expiresAt: now + dataExpiryLength,
  };
  meta.updaters = updaters;
  meta.update = update;
  return {
    type: RECEIVE_TYPE,
    payload: data,
    meta,
  };
}
