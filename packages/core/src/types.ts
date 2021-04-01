import { NormalizedIndex } from '@rest-hooks/normalizr';
import type {
  UpdateFunction,
  AbstractInstanceType,
  Schema,
} from '@rest-hooks/endpoint';
import { Middleware } from '@rest-hooks/use-enhanced-reducer';
import { FSAWithPayloadAndMeta, FSAWithMeta, FSA } from 'flux-standard-action';

import { ErrorableFSAWithPayloadAndMeta } from './fsa';
import { FetchShape } from './endpoint';
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

export interface NetworkError extends Error {
  status: number;
  response?: Response;
}

export type UnknownError = Error & { status?: unknown; response?: unknown };

export type State<T> = Readonly<{
  entities: {
    readonly [entityKey: string]: { readonly [pk: string]: T } | undefined;
  };
  indexes: NormalizedIndex;
  results: { readonly [key: string]: unknown | PK[] | PK | undefined };
  meta: {
    readonly [key: string]: {
      readonly date: number;
      readonly error?: NetworkError | UnknownError;
      readonly expiresAt: number;
      readonly prevExpiresAt?: number;
      readonly invalidated?: boolean;
    };
  };
  entityMeta: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly date: number;
        readonly expiresAt: number;
      };
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
  updaters?: Record<string, UpdateFunction<S, any>>;
  date: number;
  expiresAt: number;
}

export type ReceiveAction<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any
> = ErrorableFSAWithPayloadAndMeta<
  typeof RECEIVE_TYPE,
  Payload,
  ReceiveMeta<S>
>;

export type ResetAction = FSA<typeof RESET_TYPE>;

interface FetchMeta<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any
> {
  type: FetchShape<any, any>['type'];
  schema: S;
  key: string;
  updaters?: Record<string, UpdateFunction<S, any>>;
  options?: FetchOptions;
  throttle: boolean;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  promise: PromiseLike<any>;
  createdAt: Date;
  optimisticResponse?: Payload;
  // indicates whether network manager processed it
  nm?: boolean;
}

export interface FetchAction<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any
> extends FSAWithPayloadAndMeta<
    typeof FETCH_TYPE,
    () => Promise<Payload>,
    FetchMeta<any, any>
  > {
  meta: FetchMeta<Payload, S>;
}

export interface SubscribeAction
  extends FSAWithMeta<typeof SUBSCRIBE_TYPE, undefined, any> {
  meta: {
    schema: Schema | undefined;
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
  init?: (state: State<any>) => void;
}
