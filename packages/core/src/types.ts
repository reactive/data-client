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

export * from './actions.js';

export type { AbstractInstanceType, UpdateFunction };

export type PK = string;

/** Normalized state for Reactive Data Client
 *
 * @see https://dataclient.io/docs/concepts/normalization
 */
export interface State<T> {
  readonly entities: {
    readonly [entityKey: string]: { readonly [pk: string]: T } | undefined;
  };
  readonly endpoints: {
    readonly [key: string]: unknown | PK[] | PK | undefined;
  };
  readonly indexes: NormalizedIndex;
  readonly meta: {
    readonly [key: string]: {
      readonly date: number;
      readonly expiresAt: number;
      readonly prevExpiresAt?: number;
      readonly error?: ErrorTypes;
      readonly invalidated?: boolean;
      readonly errorPolicy?: 'hard' | 'soft' | undefined;
    };
  };
  readonly entityMeta: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly fetchedAt: number;
        readonly date: number;
        readonly expiresAt: number;
      };
    };
  };
  readonly optimistic: (SetResponseAction | OptimisticAction)[];
  readonly lastReset: number;
}

/** Singletons that handle global side-effects
 *
 * Kind of like useEffect() for the central data store
 *
 * @see https://dataclient.io/docs/api/Manager
 */
export interface Manager<Actions = ActionTypes> {
  /** @see https://dataclient.io/docs/api/Manager#getmiddleware */
  getMiddleware?(): Middleware<Actions>;
  /** @see https://dataclient.io/docs/api/Manager#middleware */
  middleware?: Middleware<Actions>;
  /** @see https://dataclient.io/docs/api/Manager#cleanup */
  cleanup(): void;
  /** @see https://dataclient.io/docs/api/Manager#init */
  init?: (state: State<any>) => void;
}

export type { Dispatch, Middleware, MiddlewareAPI };
