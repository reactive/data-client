/* These are the actions actually created */
import {
  EndpointExtraOptions,
  EndpointInterface,
  Schema,
} from '@rest-hooks/normalizr';

import {
  FetchAction,
  FetchMeta,
  GCAction,
  InvalidateAction,
  OptimisticAction,
  ReceiveAction,
  ReceiveActionError,
  ReceiveActionSuccess,
  ReceiveMeta,
  ResetAction,
  SubscribeAction,
  UnsubscribeAction,
} from './newActions.js';

export interface CompatibleFetchMeta extends FetchMeta {
  key: string;
  schema?: Schema;
  type: 'mutate' | 'read';
  update?: (result: any, ...args: any) => Record<string, (...args: any) => any>;
  options?: EndpointExtraOptions;
  optimisticResponse?: {};
}
export interface CompatibleFetchAction<
  E extends EndpointInterface = EndpointInterface,
> extends FetchAction<E> {
  meta: CompatibleFetchMeta;
}

export interface CompatibleReceiveMeta extends ReceiveMeta {
  key: string;
  schema?: any;
  update?: (result: any, ...args: any) => Record<string, (...args: any) => any>;
  errorPolicy?: (error: any) => 'hard' | 'soft' | undefined;
}
export interface CompatibleReceiveActionSuccess<
  E extends EndpointInterface = EndpointInterface,
> extends ReceiveActionSuccess<E> {
  meta: CompatibleReceiveMeta;
  payload: any;
}
export interface CompatibleReceiveActionError<
  E extends EndpointInterface = EndpointInterface,
> extends ReceiveActionError<E> {
  meta: CompatibleReceiveMeta;
  payload: any;
}
export type CompatibleReceiveAction<
  E extends EndpointInterface = EndpointInterface,
> = CompatibleReceiveActionSuccess<E> | CompatibleReceiveActionError<E>;

export interface CompatibleSubscribeAction<
  E extends EndpointInterface = EndpointInterface,
> extends SubscribeAction<E> {
  meta: {
    args: readonly any[];
    schema: Schema | undefined;
    fetch: () => Promise<any>;
    key: string;
    options: EndpointExtraOptions | undefined;
  };
}

export interface CompatibleUnsubscribeAction<
  E extends EndpointInterface = EndpointInterface,
> extends UnsubscribeAction<E> {
  meta: {
    args: readonly any[];
    key: string;
    options: EndpointExtraOptions | undefined;
  };
}

export type {
  OptimisticAction,
  InvalidateAction,
  ResetAction,
  GCAction,
} from './newActions.js';

export type CompatibleActionTypes =
  | CompatibleFetchAction
  | OptimisticAction
  | CompatibleReceiveAction
  | CompatibleSubscribeAction
  | CompatibleUnsubscribeAction
  | InvalidateAction
  | ResetAction
  | GCAction;
