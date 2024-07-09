import type {
  Denormalize,
  EndpointInterface,
  Queryable,
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
  SET_RESPONSE_TYPE,
} from './actionTypes.js';
import type { EndpointUpdateFunction } from './controller/types.js';

type EndpointAndUpdate<E extends EndpointInterface> = EndpointInterface & {
  update?: EndpointUpdateFunction<E>;
};
type EndpointDefault = EndpointInterface & {
  update?: EndpointUpdateFunction<EndpointInterface>;
};

/* SET */
export interface SetMeta {
  args: readonly any[];
  fetchedAt: number;
  date: number;
  expiresAt: number;
}

export interface SetAction<S extends Queryable = any> {
  type: typeof SET_TYPE;
  schema: S;
  meta: SetMeta;
  value: {} | ((previousValue: Denormalize<S>) => {});
}

/* setResponse */
export interface SetResponseMeta {
  args: readonly any[];
  key: string;
  fetchedAt: number;
  date: number;
  expiresAt: number;
}
export interface SetResponseActionSuccess<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof SET_RESPONSE_TYPE;
  endpoint: E;
  meta: SetResponseMeta;
  response: ResolveType<E>;
  error?: false;
}
export interface SetResponseActionError<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof SET_RESPONSE_TYPE;
  endpoint: E;
  meta: SetResponseMeta;
  response: UnknownError;
  error: true;
}
export type SetResponseAction<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> = SetResponseActionSuccess<E> | SetResponseActionError<E>;

/* FETCH */
export interface FetchMeta<A extends readonly any[] = readonly any[]> {
  args: A;
  key: string;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  promise: PromiseLike<any>;
  fetchedAt: number;
}

export interface FetchAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
  type: typeof FETCH_TYPE;
  endpoint: E;
  meta: FetchMeta<readonly [...Parameters<E>]>;
}

/* OPTIMISTIC */
export interface OptimisticAction<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof OPTIMISTIC_TYPE;
  endpoint: E;
  meta: SetResponseMeta;
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
  endpoints: string[];
}

export type ActionTypes =
  | FetchAction
  | OptimisticAction
  | SetAction
  | SetResponseAction
  | SubscribeAction
  | UnsubscribeAction
  | InvalidateAction
  | InvalidateAllAction
  | ExpireAllAction
  | ResetAction
  | GCAction;
