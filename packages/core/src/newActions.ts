import type {
  EndpointInterface,
  ResolveType,
  UnknownError,
} from '@data-client/normalizr';

import type {
  SET_TYPE,
  RESET_TYPE,
  FETCH_TYPE,
  SUBSCRIBE_TYPE,
  UNSUBSCRIBE_TYPE,
  INVALIDATE_TYPE,
  GC_TYPE,
  OPTIMISTIC_TYPE,
  INVALIDATEALL_TYPE,
  EXPIREALL_TYPE,
} from './actionTypes.js';
import type { EndpointUpdateFunction } from './controller/types.js';

type EndpointAndUpdate<E extends EndpointInterface> = EndpointInterface & {
  update?: EndpointUpdateFunction<E>;
};
type EndpointDefault = EndpointInterface & {
  update?: EndpointUpdateFunction<EndpointInterface>;
};

/* RECEIVE */
export interface SetMeta {
  args: readonly any[];
  key: string;
  fetchedAt: number;
  date: number;
  expiresAt: number;
}
export interface SetActionSuccess<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof SET_TYPE;
  endpoint: E;
  meta: SetMeta;
  payload: ResolveType<E>;
  error?: false;
}
export interface SetActionError<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof SET_TYPE;
  endpoint: E;
  meta: SetMeta;
  payload: UnknownError;
  error: true;
}
export type SetAction<E extends EndpointAndUpdate<E> = EndpointDefault> =
  | SetActionSuccess<E>
  | SetActionError<E>;

// TODO(breaking): Remove - legacy name compatibility
/** @deprecated use SetAction instead */
export type ReceiveAction<E extends EndpointAndUpdate<E> = EndpointDefault> =
  SetAction<E>;

/* FETCH */
export interface FetchMeta {
  args: readonly any[];
  key: string;
  throttle: boolean;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  promise: PromiseLike<any>;
  createdAt: number;
  // indicates whether network manager processed it
  nm?: boolean;
}

export interface FetchAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
  type: typeof FETCH_TYPE;
  endpoint: E;
  meta: FetchMeta;
  payload: () => ReturnType<E>;
}

/* OPTIMISTIC */
export interface OptimisticAction<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof OPTIMISTIC_TYPE;
  endpoint: E;
  meta: SetMeta;
  error?: false;
}

/* SUBSCRIBE */
export interface SubscribeAction<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof SUBSCRIBE_TYPE;
  endpoint: E;
  meta: {
    args: readonly any[];
    key: string;
  };
}

export interface UnsubscribeAction<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof UNSUBSCRIBE_TYPE;
  endpoint: E;
  meta: {
    args: readonly any[];
    key: string;
  };
}

/* EXPIRY */
export interface ExpireAllAction {
  type: typeof EXPIREALL_TYPE;
  testKey: (key: string) => boolean;
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
  | SetAction
  | SubscribeAction
  | UnsubscribeAction
  | InvalidateAction
  | InvalidateAllAction
  | ExpireAllAction
  | ResetAction
  | GCAction;
