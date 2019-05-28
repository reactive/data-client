import React from 'react';
import { FSAWithPayloadAndMeta, FSAWithMeta } from 'flux-standard-action';
import { Schema, schemas } from './resource';

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

export interface RequestOptions {
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
}

export interface ReceiveAction
  extends FSAWithPayloadAndMeta<'rest-hooks/receive', any, any> {
  meta: {
    schema: Schema;
    url: string;
    date: number;
    expiresAt: number;
  };
}
export interface RPCAction
  extends FSAWithPayloadAndMeta<'rest-hooks/rpc', any, any> {
  meta: {
    schema: Schema;
    url: string;
  };
}
export interface PurgeAction
  extends FSAWithPayloadAndMeta<'rest-hooks/purge', any, any> {
  meta: {
    schema: schemas.Entity;
    url: string;
  };
}

export interface FetchAction
  extends FSAWithPayloadAndMeta<'rest-hooks/fetch', () => Promise<any>, any> {
  meta: {
    schema?: Schema;
    url: string;
    responseType: 'rest-hooks/rpc' | 'rest-hooks/receive' | 'rest-hooks/purge';
    throttle: boolean;
    options?: RequestOptions;
    resolve: (value?: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void;
  };
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

// put other actions here in union
export type ActionTypes =
  | FetchAction
  | ReceiveAction
  | RPCAction
  | PurgeAction
  | SubscribeAction
  | UnsubscribeAction
  | InvalidateAction;

export type Middleware = <R extends React.Reducer<any, any>>({
  dispatch,
}: MiddlewareAPI<R>) => (
  next: React.Dispatch<React.ReducerAction<R>>,
) => (action: React.ReducerAction<R>) => void;

export interface MiddlewareAPI<
  R extends React.Reducer<any, any> = React.Reducer<any, any>
> {
  getState: () => React.ReducerState<R>;
  dispatch: React.Dispatch<React.ReducerAction<R>>;
}

export interface Manager {
  getMiddleware(): Middleware;
  cleanup(): void;
}
