import {
  EndpointInterface,
  NormalizedIndex,
  Schema,
} from '@rest-hooks/normalizr';
import type {
  UpdateFunction,
  AbstractInstanceType,
} from '@rest-hooks/normalizr';
import type { ErrorTypes } from '@rest-hooks/normalizr';

import { RECEIVE_TYPE } from './actionTypes.js';
import {
  CompatibleFetchAction,
  CompatibleReceiveAction,
  CompatibleSubscribeAction,
  CompatibleUnsubscribeAction,
} from './compatibleActions.js';
import { EndpointUpdateFunction } from './controller/types.js';
import * as legacyActions from './legacyActions.js';
import { Dispatch, Middleware, MiddlewareAPI } from './middlewareTypes.js';
import * as newActions from './newActions.js';
import * as previousActions from './previousActions';

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
  readonly optimistic: (
    | previousActions.ReceiveAction
    | previousActions.OptimisticAction
  )[];
  readonly lastReset: Date | number;
}

export * as legacyActions from './legacyActions.js';
export * as newActions from './newActions.js';
export type { SetAction } from './newActions.js';

/* maintain backwards compatibility */
/* TODO: switch to only include newActions in future */
export type OptimisticAction<
  E extends EndpointInterface & {
    update?: EndpointUpdateFunction<E>;
  } = EndpointInterface & {
    update?: EndpointUpdateFunction<EndpointInterface>;
  },
> = newActions.OptimisticAction<E>;
export type InvalidateAction = newActions.InvalidateAction;
export type ResetAction = newActions.ResetAction | legacyActions.ResetAction;
export type GCAction = newActions.GCAction;
export type FetchAction<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any,
> = CompatibleFetchAction | legacyActions.FetchAction<Payload, S>;
export type ReceiveAction<
  Payload extends object | string | number | null =
    | object
    | string
    | number
    | null,
  S extends Schema | undefined = any,
> = CompatibleReceiveAction | legacyActions.ReceiveAction<Payload, S>;
export type SubscribeAction =
  | CompatibleSubscribeAction
  | legacyActions.SubscribeAction;
export type UnsubscribeAction =
  | CompatibleUnsubscribeAction
  | legacyActions.UnsubscribeAction;

export type ResponseActions = ReceiveAction;

// put other actions here in union
export type OldActionTypes = previousActions.ActionTypes;

export type CombinedActionTypes =
  | OptimisticAction
  | InvalidateAction
  | ResetAction
  | GCAction
  | FetchAction
  | ReceiveAction
  | SubscribeAction
  | UnsubscribeAction;

export type ActionTypes = CombinedActionTypes;

export interface Manager<Actions = CombinedActionTypes> {
  getMiddleware(): Middleware<Actions>;
  cleanup(): void;
  init?: (state: State<any>) => void;
}

export type { Dispatch, Middleware, MiddlewareAPI };
