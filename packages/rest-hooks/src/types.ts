import React from 'react';
import { FSAWithPayloadAndMeta, FSAWithMeta, FSA } from 'flux-standard-action';

import { ErrorableFSAWithPayloadAndMeta, ErrorableFSAWithMeta } from './fsa';
import { Schema, schemas, Normalize } from './resource';

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';

export const FETCH_TYPE = 'rest-hooks/fetch' as const;
export const RECEIVE_TYPE = 'rest-hooks/receive' as const;
export const RECEIVE_MUTATE_TYPE = 'rest-hooks/rpc' as const;
export const RECEIVE_DELETE_TYPE = 'rest-hooks/purge' as const;
export const RESET_TYPE = 'rest-hooks/reset' as const;
export const SUBSCRIBE_TYPE = 'rest-hooks/subscribe' as const;
export const UNSUBSCRIBE_TYPE = 'rest-hook/unsubscribe' as const;
export const INVALIDATE_TYPE = 'rest-hooks/invalidate' as const;

export type ReceiveTypes =
  | typeof RECEIVE_TYPE
  | typeof RECEIVE_MUTATE_TYPE
  | typeof RECEIVE_DELETE_TYPE;

export type AbstractInstanceType<T> = T extends { prototype: infer U }
  ? U
  : never;

export type PK = string | number;

export type State<T> = Readonly<{
  entities: Readonly<{ [k: string]: { [id: string]: T } | undefined }>;
  results: Readonly<{ [url: string]: unknown | PK[] | PK | undefined }>;
  meta: Readonly<{
    [url: string]: { date: number; error?: Error; expiresAt: number };
  }>;
}>;

export interface FetchOptions {
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
}

interface ReceiveMeta<S extends Schema> {
  schema: S;
  url: string;
  date: number;
  updaters?: { [key: string]: UpdateFunction<S, any> };
  expiresAt: number;
}

export type ReceiveAction<
  Payload extends object | string | number = object | string | number,
  S extends Schema = any
> = ErrorableFSAWithPayloadAndMeta<
  typeof RECEIVE_TYPE,
  Payload,
  ReceiveMeta<S>
>;

interface RPCMeta<S extends Schema> {
  schema: S;
  url: string;
  updaters?: { [key: string]: UpdateFunction<S, any> };
}

export type RPCAction<
  Payload extends object | string | number = object | string | number,
  S extends Schema = any
> = ErrorableFSAWithPayloadAndMeta<
  typeof RECEIVE_MUTATE_TYPE,
  Payload,
  RPCMeta<S>
>;

interface PurgeMeta {
  schema: schemas.EntityInterface<any>;
  url: string;
}

export type PurgeAction = ErrorableFSAWithMeta<
  typeof RECEIVE_DELETE_TYPE,
  undefined,
  PurgeMeta
>;

export type ResetAction = FSA<typeof RESET_TYPE>;

export type UpdateFunction<
  SourceSchema extends Schema,
  DestSchema extends Schema
> = (
  sourceResults: Normalize<SourceSchema>,
  destResults: Normalize<DestSchema> | undefined,
) => Normalize<DestSchema>;

interface FetchMeta<S extends Schema> {
  responseType: ReceiveTypes;
  url: string;
  schema: S;
  throttle: boolean;
  updaters?: { [key: string]: UpdateFunction<S, any> };
  options?: FetchOptions;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
}

export interface FetchAction<
  Payload extends object | string | number = object | string | number,
  S extends Schema = any
>
  extends FSAWithPayloadAndMeta<
    typeof FETCH_TYPE,
    () => Promise<Payload>,
    FetchMeta<any>
  > {
  meta: FetchMeta<S>;
}

export interface SubscribeAction
  extends FSAWithMeta<typeof SUBSCRIBE_TYPE, undefined, any> {
  meta: {
    schema: Schema;
    fetch: () => Promise<any>;
    url: string;
    frequency?: number;
  };
}

export interface UnsubscribeAction
  extends FSAWithMeta<typeof UNSUBSCRIBE_TYPE, undefined, any> {
  meta: {
    url: string;
    frequency?: number;
  };
}

export interface InvalidateAction
  extends FSAWithMeta<typeof INVALIDATE_TYPE, undefined, any> {
  meta: {
    url: string;
  };
}

export type ResponseActions = ReceiveAction | RPCAction | PurgeAction;

// put other actions here in union
export type ActionTypes =
  | FetchAction
  | ResponseActions
  | SubscribeAction
  | UnsubscribeAction
  | InvalidateAction
  | ResetAction;

export type Dispatch<R extends React.Reducer<any, any>> = (
  action: React.ReducerAction<R>,
) => Promise<void>;

export type Middleware = <R extends React.Reducer<any, any>>({
  dispatch,
}: MiddlewareAPI<R>) => (next: Dispatch<R>) => Dispatch<R>;

export interface MiddlewareAPI<
  R extends React.Reducer<any, any> = React.Reducer<any, any>
> {
  getState: () => React.ReducerState<R>;
  dispatch: Dispatch<R>;
}

export interface Manager {
  getMiddleware(): Middleware;
  cleanup(): void;
}
