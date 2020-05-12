import { Schema } from '@rest-hooks/normalizr';
import {
  FetchAction,
  ReceiveAction,
  PurgeAction,
  FetchOptions,
} from '@rest-hooks/core/types';

import SHAPE_TYPE_TO_RESPONSE_TYPE from './responseTypeMapping';

interface Options<
  Payload extends object | string | number = object | string | number,
  S extends Schema = any
>
  extends Pick<
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
  Payload extends object | string | number = object | string | number,
  S extends Schema = any
>(
  data: Payload,
  { schema, key, type, updaters, dataExpiryLength }: Options<Payload, S>,
): ReceiveAction<Payload, S> | PurgeAction {
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && dataExpiryLength < 0) {
    throw new Error('Negative dataExpiryLength are not allowed.');
  }
  const now = Date.now();
  const meta: ReceiveAction['meta'] | PurgeAction['meta'] = {
    schema,
    key,
    date: now,
    expiresAt: now + dataExpiryLength,
  };
  if ((['read', 'mutate'] as string[]).includes(type)) {
    meta.updaters = updaters;
  }
  return {
    type: SHAPE_TYPE_TO_RESPONSE_TYPE[type] as any,
    payload: data,
    meta,
  };
}
