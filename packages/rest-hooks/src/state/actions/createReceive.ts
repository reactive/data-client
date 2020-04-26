import { Schema } from 'rest-hooks/resource';
import {
  FetchAction,
  ReceiveAction,
  PurgeAction,
  ReceiveTypes,
} from 'rest-hooks/types';
import { RECEIVE_TYPE, RECEIVE_MUTATE_TYPE } from 'rest-hooks/actionTypes';

import { RPCAction } from '../..';

export default function createReceive<
  Payload extends object | string | number = object | string | number,
  S extends Schema = any
>(
  data: Payload,
  {
    schema,
    key,
    responseType,
    updaters,
    options = {},
  }: Pick<
    FetchAction<Payload, S>['meta'],
    'schema' | 'key' | 'responseType' | 'updaters' | 'options'
  >,
  { dataExpiryLength }: { dataExpiryLength: number },
): ReceiveAction<Payload, S> | RPCAction<Payload, S> | PurgeAction {
  const expiryLength = options.dataExpiryLength ?? dataExpiryLength;
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development' && expiryLength < 0) {
    throw new Error('Negative dataExpiryLength are not allowed.');
  }
  const now = Date.now();
  const meta:
    | ReceiveAction['meta']
    | RPCAction['meta']
    | PurgeAction['meta'] = {
    schema,
    key,
    date: now,
    expiresAt: now + expiryLength,
  };
  if (
    ([RECEIVE_TYPE, RECEIVE_MUTATE_TYPE] as ReceiveTypes[]).includes(
      responseType,
    )
  ) {
    meta.updaters = updaters;
  }
  return {
    type: responseType as any,
    payload: data,
    meta,
  };
}
