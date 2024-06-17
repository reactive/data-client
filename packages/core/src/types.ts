import { NormalizedIndex } from '@data-client/normalizr';
import type {
  UpdateFunction,
  AbstractInstanceType,
} from '@data-client/normalizr';
import type { ErrorTypes } from '@data-client/normalizr';

import type {
  ActionTypes,
  SetResponseAction,
  OptimisticAction,
} from './actions.js';
import type { Dispatch, Middleware, MiddlewareAPI } from './middlewareTypes.js';

export type { AbstractInstanceType, UpdateFunction };

export type PK = string;

export interface State<T> {
  readonly entities: {
    readonly [entityKey: string]: { readonly [pk: string]: T } | undefined;
  };
  readonly indexes: NormalizedIndex;
  readonly endpoints: {
    readonly [key: string]: unknown | PK[] | PK | undefined;
  };
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
  readonly optimistic: (SetResponseAction | OptimisticAction)[];
  readonly lastReset: number;
}

export * from './actions.js';

export interface Manager<Actions = ActionTypes> {
  getMiddleware(): Middleware<Actions>;
  cleanup(): void;
  init?: (state: State<any>) => void;
}

export type { Dispatch, Middleware, MiddlewareAPI };
