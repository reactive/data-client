import type { Schema } from '@data-client/normalizr';

import { SUBSCRIBE_TYPE, UNSUBSCRIBE_TYPE } from '../actionTypes.js';
import type {
  Manager,
  State,
  MiddlewareAPI,
  Middleware,
  Dispatch,
  UnsubscribeAction,
  SubscribeAction,
} from '../types.js';

type Actions = UnsubscribeAction | SubscribeAction;

/** Properties sent to Subscription constructor */
export interface SubscriptionInit {
  schema?: Schema | undefined;
  fetch: () => Promise<any>;
  key: string;
  getState: () => State<unknown>;
  frequency?: number | undefined;
}

/** Interface handling a single resource subscription */
export interface Subscription {
  add(frequency?: number): void;
  remove(frequency?: number): boolean;
  cleanup(): void;
}

/** The static class that constructs Subscription */
export interface SubscriptionConstructable {
  new (init: SubscriptionInit, dispatch: Dispatch<any>): Subscription;
}

/** Handles subscription actions -> fetch or receive actions
 *
 * Constructor takes a SubscriptionConstructable class to control how
 * subscriptions are handled. (e.g., polling, websockets)
 *
 * @see https://resthooks.io/docs/api/SubscriptionManager
 */
export default class SubscriptionManager<S extends SubscriptionConstructable>
  implements Manager
{
  protected subscriptions: {
    [key: string]: InstanceType<S>;
  } = {};

  protected declare readonly Subscription: S;
  protected declare middleware: Middleware;

  constructor(Subscription: S) {
    this.Subscription = Subscription;

    this.middleware = <C extends MiddlewareAPI>({ dispatch, getState }: C) => {
      return (next: C['dispatch']): C['dispatch'] =>
        action => {
          switch (action.type) {
            case SUBSCRIBE_TYPE:
              try {
                this.handleSubscribe(action, dispatch, getState);
              } catch (e) {
                console.error(e);
              }
              return Promise.resolve();
            case UNSUBSCRIBE_TYPE:
              this.handleUnsubscribe(action, dispatch);
              return Promise.resolve();
            default:
              return next(action);
          }
        };
    };
  }

  /** Ensures all subscriptions are cleaned up. */
  cleanup() {
    for (const key in this.subscriptions) {
      this.subscriptions[key].cleanup();
    }
  }

  /** Called when middleware intercepts 'rest-hooks/subscribe' action.
   *
   */
  protected handleSubscribe(
    action: SubscribeAction,
    dispatch: (action: any) => Promise<void>,
    getState: () => State<unknown>,
  ) {
    let options: SubscriptionInit;
    if (action.endpoint) {
      const { endpoint } = action;
      const { args } = action.meta;
      options = {
        schema: endpoint.schema,
        fetch: () => endpoint(...args),
        frequency: endpoint.pollFrequency,
        key: endpoint.key(...args),
        getState,
      };
    } else {
      options = {
        key: action.meta.key,
        frequency: action.meta.options?.pollFrequency,
        schema: action.meta.schema,
        fetch: action.meta.fetch,
        getState,
      };
    }

    if (options.key in this.subscriptions) {
      this.subscriptions[options.key].add(options.frequency);
    } else {
      this.subscriptions[options.key] = new this.Subscription(
        options,
        dispatch,
      ) as InstanceType<S>;
    }
  }

  /** Called when middleware intercepts 'rest-hooks/unsubscribe' action.
   *
   */
  protected handleUnsubscribe(
    action: UnsubscribeAction,
    dispatch: (action: any) => Promise<void>,
  ) {
    const key = action.meta.key;
    const frequency = action.meta.options?.pollFrequency;

    /* istanbul ignore else */
    if (key in this.subscriptions) {
      const empty = this.subscriptions[key].remove(frequency);
      if (empty) {
        delete this.subscriptions[key];
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.error(`Mismatched unsubscribe: ${key} is not subscribed`);
    }
  }

  /** Attaches Manager to store
   *
   * Intercepts 'rest-hooks/subscribe'/'rest-hooks/unsubscribe' to register resources that
   * need to be kept up to date.
   *
   * Will possibly dispatch 'rest-hooks/fetch' or 'rest-hooks/receive' to keep resources fresh
   *
   */
  getMiddleware() {
    return this.middleware;
  }
}
