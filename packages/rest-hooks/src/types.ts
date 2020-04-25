import { NormalizedIndex } from '@rest-hooks/normalizr';
import type { AbstractInstanceType } from '@rest-hooks/normalizr';
import { Middleware } from '@rest-hooks/use-enhanced-reducer';
import { FSAWithPayloadAndMeta, FSAWithMeta, FSA } from 'flux-standard-action';

import { ErrorableFSAWithPayloadAndMeta, ErrorableFSAWithMeta } from './fsa';
import { Schema, schemas, Normalize } from './resource';
import {
  RECEIVE_TYPE,
  RECEIVE_MUTATE_TYPE,
  RECEIVE_DELETE_TYPE,
  RESET_TYPE,
  FETCH_TYPE,
  SUBSCRIBE_TYPE,
  UNSUBSCRIBE_TYPE,
  INVALIDATE_TYPE,
} from './actionTypes';

export type { AbstractInstanceType };

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';

export type ReceiveTypes =
  | typeof RECEIVE_TYPE
  | typeof RECEIVE_MUTATE_TYPE
  | typeof RECEIVE_DELETE_TYPE;

export type PK = string;

export type State<T> = Readonly<{
  entities: {
    readonly [entityKey: string]: { readonly [pk: string]: T } | undefined;
  };
  indexes: NormalizedIndex;
  results: { readonly [url: string]: unknown | PK[] | PK | undefined };
  meta: {
    readonly [url: string]: {
      readonly date: number;
      readonly error?: Error;
      readonly expiresAt: number;
    };
  };
  optimistic: ResponseActions[];
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
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  readonly optimisticUpdate?: (
    params: Readonly<object>,
    body: Readonly<object | string> | void,
  ) => any;
  /** User-land extra data to send */
  readonly extra?: any;
}

interface ReceiveMeta<S extends Schema> {
  schema: S;
  url: string;
  date: number;
  updaters?: Record<string, UpdateFunction<S, any>>;
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
  date: number;
  updaters?: Record<string, UpdateFunction<S, any>>;
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
  date: number;
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

interface FetchMeta<
  Payload extends object | string | number = object | string | number,
  S extends Schema = any
> {
  responseType: ReceiveTypes;
  url: string;
  schema: S;
  throttle: boolean;
  updaters?: Record<string, UpdateFunction<S, any>>;
  options?: FetchOptions;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  promise: PromiseLike<any>;
  optimisticResponse?: Payload;
  // indicates whether network manager processed it
  nm?: boolean;
}

export interface FetchAction<
  Payload extends object | string | number = object | string | number,
  S extends Schema = any
>
  extends FSAWithPayloadAndMeta<
    typeof FETCH_TYPE,
    () => Promise<Payload>,
    FetchMeta<any, any>
  > {
  meta: FetchMeta<Payload, S>;
}

export interface SubscribeAction
  extends FSAWithMeta<typeof SUBSCRIBE_TYPE, undefined, any> {
  meta: {
    schema: Schema;
    fetch: () => Promise<any>;
    url: string;
    options: FetchOptions | undefined;
  };
}

export interface UnsubscribeAction
  extends FSAWithMeta<typeof UNSUBSCRIBE_TYPE, undefined, any> {
  meta: {
    url: string;
    options: FetchOptions | undefined;
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

export interface Manager {
  getMiddleware(): Middleware;
  cleanup(): void;
}
