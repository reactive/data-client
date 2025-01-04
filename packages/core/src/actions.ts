import type {
  Denormalize,
  EndpointInterface,
  EntityPath,
  Queryable,
  ResolveType,
  UnknownError,
} from '@data-client/normalizr';

import type {
  SET,
  RESET,
  FETCH,
  SUBSCRIBE,
  UNSUBSCRIBE,
  INVALIDATE,
  GC,
  OPTIMISTIC,
  INVALIDATEALL,
  EXPIREALL,
  SET_RESPONSE,
  REF,
} from './actionTypes.js';
import type { EndpointUpdateFunction } from './controller/types.js';

type EndpointAndUpdate<E extends EndpointInterface> = EndpointInterface & {
  update?: EndpointUpdateFunction<E>;
};
type EndpointDefault = EndpointInterface & {
  update?: EndpointUpdateFunction<EndpointInterface>;
};

/** General meta-data for operators */
export interface ActionMeta {
  readonly fetchedAt: number;
  readonly date: number;
  readonly expiresAt: number;
}

/** Action for Controller.set() */
export interface SetAction<S extends Queryable = any> {
  type: typeof SET;
  schema: S;
  args: readonly any[];
  meta: ActionMeta;
  value: {} | ((previousValue: Denormalize<S>) => {});
}

/* setResponse */
export interface SetResponseActionBase<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof SET_RESPONSE;
  endpoint: E;
  args: readonly any[];
  key: string;
  meta: ActionMeta;
}
export interface SetResponseActionSuccess<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> extends SetResponseActionBase<E> {
  response: ResolveType<E>;
  error?: false;
}
export interface SetResponseActionError<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> extends SetResponseActionBase<E> {
  response: UnknownError;
  error: true;
}
/** Action for Controller.setResponse() */
export type SetResponseAction<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> = SetResponseActionSuccess<E> | SetResponseActionError<E>;

/* FETCH */
export interface FetchMeta {
  fetchedAt: number;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  promise: PromiseLike<any>;
}

/** Action for Controller.fetch() */
export interface FetchAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
  type: typeof FETCH;
  endpoint: E;
  args: readonly [...Parameters<E>];
  key: string;
  meta: FetchMeta;
}

/* OPTIMISTIC */
/** Action for Endpoint.getOptimisticResponse() */
export interface OptimisticAction<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof OPTIMISTIC;
  endpoint: E;
  args: readonly any[];
  key: string;
  meta: ActionMeta;
  error?: false;
}

/* SUBSCRIBE */
/** Action for Controller.subscribe() */
export interface SubscribeAction<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof SUBSCRIBE;
  endpoint: E;
  args: readonly any[];
  key: string;
}

/** Action for Controller.unsubscribe() */
export interface UnsubscribeAction<
  E extends EndpointAndUpdate<E> = EndpointDefault,
> {
  type: typeof UNSUBSCRIBE;
  endpoint: E;
  args: readonly any[];
  key: string;
}

/* EXPIRY */
export interface ExpireAllAction {
  type: typeof EXPIREALL;
  testKey: (key: string) => boolean;
}

/* INVALIDATE */
export interface InvalidateAllAction {
  type: typeof INVALIDATEALL;
  testKey: (key: string) => boolean;
}

export interface InvalidateAction {
  type: typeof INVALIDATE;
  key: string;
}

/* RESET */
export interface ResetAction {
  type: typeof RESET;
  date: number;
}

/* GC */
export interface GCAction {
  type: typeof GC;
  entities: EntityPath[];
  endpoints: string[];
}
/* ref counting */
export interface RefAction<E extends EndpointAndUpdate<E> = EndpointDefault> {
  type: typeof REF;
  key: string;
  paths: EntityPath[];
  incr: boolean;
}

/** @see https://dataclient.io/docs/api/Actions */
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
  | GCAction
  | RefAction;
