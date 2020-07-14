import { NormalizedIndex } from '@rest-hooks/normalizr';
import { UpdateFunction } from '@rest-hooks/endpoint';
import type { AbstractInstanceType, Schema } from '@rest-hooks/normalizr';
import { Middleware } from '@rest-hooks/use-enhanced-reducer';
import { FSAWithPayloadAndMeta, FSAWithMeta, FSA } from 'flux-standard-action';
import {
  EndpointInterface,
  ResolveType,
  FetchFunction,
} from '@rest-hooks/endpoint';

import { ErrorableFSAWithPayloadAndMeta } from './fsa';
import {
  RECEIVE_TYPE,
  RESET_TYPE,
  FETCH_TYPE,
  SUBSCRIBE_TYPE,
  UNSUBSCRIBE_TYPE,
  INVALIDATE_TYPE,
} from './actionTypes';

export type { AbstractInstanceType, UpdateFunction };

export type ReceiveTypes = typeof RECEIVE_TYPE;

export type PK = string;

export type State<T> = Readonly<{
  entities: {
    readonly [entityKey: string]: { readonly [pk: string]: T } | undefined;
  };
  indexes: NormalizedIndex;
  results: { readonly [key: string]: unknown | PK[] | PK | undefined };
  meta: {
    readonly [key: string]: {
      readonly date: number;
      readonly error?: Error;
      readonly expiresAt: number;
      readonly prevExpiresAt?: number;
      readonly invalidated?: boolean;
    };
  };
  optimistic: ReceiveAction[];
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

export interface ReceiveMeta<S extends Schema | undefined> {
  schema: S;
  key: string;
  updaters?: S extends undefined
    ? undefined
    : Record<string, UpdateFunction<Exclude<S, undefined>, any>>;
  date: number;
  expiresAt: number;
}

export type ReceiveAction<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema = any
> = ErrorableFSAWithPayloadAndMeta<
  typeof RECEIVE_TYPE,
  Payload,
  ReceiveMeta<S>
>;

export type ResetAction = FSA<typeof RESET_TYPE>;

interface FetchMeta<
  E extends EndpointInterface<FetchFunction, any, any> = EndpointInterface<
    FetchFunction,
    any,
    any
  >
> {
  throttle: boolean;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  promise: PromiseLike<any>;
  updaters?: E['schema'] extends undefined
    ? undefined
    : Record<string, UpdateFunction<E['schema'], any>>;
  optimisticResponse?: ResolveType<E>;
  // indicates whether network manager processed it
  nm?: boolean;
}

export interface FetchAction<
  E extends EndpointInterface<FetchFunction, any, any> = EndpointInterface<
    FetchFunction,
    any,
    any
  >
> {
  type: typeof FETCH_TYPE;
  endpoint: E;
  args: Readonly<Parameters<E>>;
  meta: FetchMeta<E>;
}

export interface SubscribeAction
  extends FSAWithMeta<typeof SUBSCRIBE_TYPE, undefined, any> {
  meta: {
    schema: Schema;
    fetch: () => Promise<any>;
    key: string;
    options: FetchOptions | undefined;
  };
}

export interface UnsubscribeAction
  extends FSAWithMeta<typeof UNSUBSCRIBE_TYPE, undefined, any> {
  meta: {
    key: string;
    options: FetchOptions | undefined;
  };
}

export interface InvalidateAction
  extends FSAWithMeta<typeof INVALIDATE_TYPE, undefined, any> {
  meta: {
    key: string;
  };
}

export type MountedAction = { type: 'rest-hook/mounted'; payload: string };

export type ResponseActions = ReceiveAction;

// put other actions here in union
export type ActionTypes =
  | FetchAction
  | ReceiveAction
  | SubscribeAction
  | UnsubscribeAction
  | InvalidateAction
  | ResetAction
  | MountedAction;

export interface Manager {
  getMiddleware(): Middleware;
  cleanup(): void;
}
