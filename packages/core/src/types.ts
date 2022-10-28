import { NormalizedIndex } from '@rest-hooks/normalizr';
import { Dispatch } from '@rest-hooks/use-enhanced-reducer';
import { FSAWithPayloadAndMeta, FSAWithMeta } from 'flux-standard-action';
import type {
  UpdateFunction,
  AbstractInstanceType,
  Schema,
  EndpointExtraOptions,
  EndpointInterface,
} from '@rest-hooks/normalizr';
import type { ErrorTypes } from '@rest-hooks/normalizr';

import { ErrorableFSAWithPayloadAndMeta } from './fsa.js';
import { FetchShape } from './endpoint/index.js';
import {
  RECEIVE_TYPE,
  RESET_TYPE,
  FETCH_TYPE,
  SUBSCRIBE_TYPE,
  UNSUBSCRIBE_TYPE,
  INVALIDATE_TYPE,
  GC_TYPE,
  OPTIMISTIC_TYPE,
} from './actionTypes.js';
import type Controller from './controller/Controller.js';
import type { EndpointUpdateFunction } from './controller/types.js';

export type { AbstractInstanceType, UpdateFunction };

export type ReceiveTypes = typeof RECEIVE_TYPE;

export type PK = string;

export interface State<T> {
  readonly entities: {
    readonly [entityKey: string]: { readonly [pk: string]: T } | undefined;
  };
  readonly indexes: NormalizedIndex;
  readonly results: { readonly [key: string]: unknown | PK[] | PK | undefined };
  readonly meta: {
    readonly [key: string]: {
      readonly date: number;
      readonly error?: ErrorTypes;
      readonly expiresAt: number;
      readonly prevExpiresAt?: number;
      readonly invalidated?: boolean;
      readonly errorPolicy?: 'hard' | 'soft' | undefined;
    };
  };
  readonly entityMeta: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly date: number;
        readonly expiresAt: number;
        readonly fetchedAt: number;
      };
    };
  };
  readonly optimistic: (ReceiveAction | OptimisticAction)[];
  readonly lastReset: Date | number;
}

export interface ReceiveMeta<S extends Schema | undefined> {
  schema?: S;
  key: string;
  args?: readonly any[];
  updaters?: Record<string, UpdateFunction<S, any>>;
  update?: (result: any, ...args: any) => Record<string, (...args: any) => any>;
  fetchedAt?: number;
  date: number;
  expiresAt: number;
  errorPolicy?: (error: any) => 'hard' | 'soft' | undefined;
}

export type ReceiveAction<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any,
> = ErrorableFSAWithPayloadAndMeta<
  typeof RECEIVE_TYPE,
  Payload,
  ReceiveMeta<S>
> & { endpoint?: EndpointInterface };

export type OptimisticAction<
  E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
  } = EndpointInterface & {
    update?: EndpointUpdateFunction<EndpointInterface>;
  },
> = {
  type: typeof OPTIMISTIC_TYPE;
  meta: {
    schema: E['schema'];
    key: string;
    args: readonly any[];
    update?: (
      result: any,
      ...args: any
    ) => Record<string, (...args: any) => any>;
    fetchedAt: number;
    date: number;
    expiresAt: number;
    errorPolicy?: (error: any) => 'hard' | 'soft' | undefined;
  };
  endpoint: E;
  error?: undefined;
};

export interface ResetAction {
  type: typeof RESET_TYPE;
  date: number | Date;
}

interface FetchMeta<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any,
> {
  type: FetchShape<any, any>['type'];
  schema?: S;
  key: string;
  args?: readonly any[];
  updaters?: Record<string, UpdateFunction<S, any>>;
  update?: (result: any, ...args: any) => Record<string, (...args: any) => any>;
  options?: EndpointExtraOptions;
  throttle: boolean;
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  promise: PromiseLike<any>;
  createdAt: number | Date;
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
  S extends Schema | undefined = any,
> extends FSAWithPayloadAndMeta<
    typeof FETCH_TYPE,
    () => Promise<Payload>,
    FetchMeta<any, any>
  > {
  meta: FetchMeta<Payload, S>;
  endpoint?: EndpointInterface;
}

export interface SubscribeAction
  extends FSAWithMeta<typeof SUBSCRIBE_TYPE, undefined, any> {
  endpoint?: EndpointInterface;
  meta: {
    args?: readonly any[];
    schema: Schema | undefined;
    fetch: () => Promise<any>;
    key: string;
    options: EndpointExtraOptions | undefined;
  };
}

export interface UnsubscribeAction
  extends FSAWithMeta<typeof UNSUBSCRIBE_TYPE, undefined, any> {
  endpoint?: EndpointInterface;
  meta: {
    args?: readonly any[];
    key: string;
    options: EndpointExtraOptions | undefined;
  };
}

export interface InvalidateAction
  extends FSAWithMeta<typeof INVALIDATE_TYPE, undefined, any> {
  meta: {
    key: string;
  };
}

export interface GCAction {
  type: typeof GC_TYPE;
  entities: [string, string][];
  results: string[];
}

export type ResponseActions = ReceiveAction;

// put other actions here in union
export type ActionTypes =
  | FetchAction
  | OptimisticAction
  | ReceiveAction
  | SubscribeAction
  | UnsubscribeAction
  | InvalidateAction
  | ResetAction
  | GCAction;

export interface Manager {
  getMiddleware(): Middleware;
  cleanup(): void;
  init?: (state: State<any>) => void;
}

export type Middleware = <R extends React.Reducer<any, any>>(
  options: MiddlewareAPI<R>,
) => (next: Dispatch<R>) => Dispatch<R>;

export interface MiddlewareAPI<
  R extends React.Reducer<any, any> = React.Reducer<any, any>,
> {
  getState: () => React.ReducerState<R>;
  dispatch: Dispatch<R>;
  controller: Controller;
}

export type { Dispatch };
