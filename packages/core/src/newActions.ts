import type {
  EndpointInterface,
  ResolveType,
  UnknownError,
} from '@rest-hooks/normalizr';

import type {
  RECEIVE_TYPE,
  RESET_TYPE,
  FETCH_TYPE,
  SUBSCRIBE_TYPE,
  UNSUBSCRIBE_TYPE,
  INVALIDATE_TYPE,
  GC_TYPE,
  OPTIMISTIC_TYPE,
  INVALIDATEALL_TYPE,
} from './actionTypes.js';
import type { EndpointUpdateFunction } from './controller/types.js';

/* RECEIVE */
export interface ReceiveMeta {
  args: readonly any[];
  fetchedAt: number;
  date: number;
  expiresAt: number;
}
export interface ReceiveActionSuccess<
  E extends EndpointInterface = EndpointInterface,
> {
  type: typeof RECEIVE_TYPE;
  endpoint: E;
  meta: ReceiveMeta;
  payload: ResolveType<E>;
  error?: false;
}
export interface ReceiveActionError<
  E extends EndpointInterface = EndpointInterface,
> {
  type: typeof RECEIVE_TYPE;
  endpoint: E;
  meta: ReceiveMeta;
  payload: UnknownError;
  error: true;
}
export type ReceiveAction<E extends EndpointInterface = EndpointInterface> =
  | ReceiveActionSuccess<E>
  | ReceiveActionError<E>;

export type SetAction<E extends EndpointInterface = EndpointInterface> =
  ReceiveAction<E>;

/* FETCH */
export interface FetchMeta {
  args: readonly any[];
  throttle: boolean;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  promise: PromiseLike<any>;
  createdAt: number;
  // indicates whether network manager processed it
  nm?: boolean;
}

export interface FetchAction<E extends EndpointInterface = EndpointInterface> {
  type: typeof FETCH_TYPE;
  endpoint: E;
  meta: FetchMeta;
  payload: () => ReturnType<E>;
}

/* OPTIMISTIC */
export interface OptimisticAction<
  E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
  } = EndpointInterface & {
    update?: EndpointUpdateFunction<EndpointInterface>;
  },
> {
  type: typeof OPTIMISTIC_TYPE;
  endpoint: E;
  meta: ReceiveMeta;
  error?: boolean;
}

/* SUBSCRIBE */
export interface SubscribeAction<
  E extends EndpointInterface = EndpointInterface,
> {
  type: typeof SUBSCRIBE_TYPE;
  endpoint: E;
  meta: {
    args: readonly any[];
  };
}

export interface UnsubscribeAction<
  E extends EndpointInterface = EndpointInterface,
> {
  type: typeof UNSUBSCRIBE_TYPE;
  endpoint: E;
  meta: {
    args: readonly any[];
  };
}

/* INVALIDATE */
export interface InvalidateAllAction {
  type: typeof INVALIDATEALL_TYPE;
  testKey: (key: string) => boolean;
}

export interface InvalidateAction {
  type: typeof INVALIDATE_TYPE;
  meta: {
    key: string;
  };
}

/* RESET */
export interface ResetAction {
  type: typeof RESET_TYPE;
  date: number;
}

/* GC */
export interface GCAction {
  type: typeof GC_TYPE;
  entities: [string, string][];
  results: string[];
}

export type ActionTypes =
  | FetchAction
  | OptimisticAction
  | ReceiveAction
  | SubscribeAction
  | UnsubscribeAction
  | InvalidateAction
  | ResetAction
  | GCAction;
