import React from 'react';
import { FSAWithPayloadAndMeta, FSAWithMeta, FSA } from 'flux-standard-action';
import {
  ErrorableFSAWithPayloadAndMeta,
  ErrorableFSAWithMeta,
  ErrorableFSAWithPayload,
} from './fsa';
import { Schema, schemas } from './resource';
import { ResultType } from '~/resource/normal';

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';

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
  'rest-hooks/receive',
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
> = ErrorableFSAWithPayloadAndMeta<'rest-hooks/rpc', Payload, RPCMeta<S>>;

interface PurgeMeta {
  schema: schemas.Entity;
  url: string;
}

export type PurgeAction = ErrorableFSAWithMeta<
  'rest-hooks/purge',
  undefined,
  PurgeMeta
>;

export type ResetAction = FSA<'rest-hooks/reset'>;

export type OptimisticUpdatePayload = {
  [key: string]: <T>(result: T | undefined, key: string) => T;
};

export type UpdateFunction<
  SourceSchema extends Schema,
  DestSchema extends Schema
> = (
  sourceResults: ResultType<SourceSchema>,
  destResults: ResultType<DestSchema>,
) => ResultType<DestSchema>;

export type OptimisticUpdateAction = ErrorableFSAWithPayload<
  'rest-hooks/optimistic-update',
  OptimisticUpdatePayload
>;

interface FetchMeta<S extends Schema> {
  responseType: 'rest-hooks/receive' | 'rest-hooks/rpc' | 'rest-hooks/purge';
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
    'rest-hooks/fetch',
    () => Promise<Payload>,
    FetchMeta<any>
  > {
  meta: FetchMeta<S>;
}

export interface SubscribeAction
  extends FSAWithMeta<'rest-hooks/subscribe', undefined, any> {
  meta: {
    schema: Schema;
    fetch: () => Promise<any>;
    url: string;
    frequency?: number;
  };
}

export interface UnsubscribeAction
  extends FSAWithMeta<'rest-hooks/unsubscribe', undefined, any> {
  meta: {
    url: string;
    frequency?: number;
  };
}

export interface InvalidateAction
  extends FSAWithMeta<'rest-hooks/invalidate', undefined, any> {
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
