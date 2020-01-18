import { Schema } from '~/resource';
import {
  FetchAction,
  ReceiveAction,
  PurgeAction,
  ResponseActions,
} from '~/types';
import { RECEIVE_TYPE, RECEIVE_MUTATE_TYPE } from '~/actionTypes';
import { RPCAction } from '..';

export function createReceive<
  Payload extends object | string | number = object | string | number,
  S extends Schema = any
>(
  data: Payload,
  {
    schema,
    url,
    responseType,
    updaters,
    options = {},
  }: FetchAction<Payload, S>['meta'],
  { dataExpiryLength }: { dataExpiryLength: number },
): ReceiveAction<Payload, S> | RPCAction<Payload, S> | PurgeAction {
  const expiryLength = options.dataExpiryLength || dataExpiryLength;
  const now = Date.now();
  const meta:
    | ReceiveAction['meta']
    | RPCAction['meta']
    | PurgeAction['meta'] = {
    schema,
    url,
    date: now,
    expiresAt: now + expiryLength,
  };
  if (
    ([RECEIVE_TYPE, RECEIVE_MUTATE_TYPE] as string[]).includes(responseType)
  ) {
    meta.updaters = updaters;
  }
  return {
    type: responseType as any,
    payload: data,
    meta,
  };
}

export function createReceiveError<S extends Schema = any>(
  error: any,
  { schema, url, responseType, options = {} }: FetchAction<any, S>['meta'],
  { errorExpiryLength }: { errorExpiryLength: number },
): ResponseActions {
  const expiryLength = options.errorExpiryLength || errorExpiryLength;
  const now = Date.now();
  return {
    type: responseType as any,
    payload: error,
    meta: {
      schema,
      url,
      date: now,
      expiresAt: now + expiryLength,
    },
    error: true,
  };
}
