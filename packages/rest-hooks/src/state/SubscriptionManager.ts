import {
  MiddlewareAPI,
  Middleware,
  SubscribeAction,
  UnsubscribeAction,
  Manager,
  Dispatch,
} from 'rest-hooks/types';
import { SUBSCRIBE_TYPE, UNSUBSCRIBE_TYPE } from 'rest-hooks/actionTypes';
import { Schema } from 'rest-hooks/resource';

type Actions = UnsubscribeAction | SubscribeAction;

/** Properties sent to Subscription constructor */
export interface SubscriptionInit {
  schema: Schema;
  fetch: () => Promise<any>;
  url: string;
  frequency?: number;
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
 */
export default class SubscriptionManager<S extends SubscriptionConstructable>
  implements Manager {
  protected subscriptions: {
    [url: string]: InstanceType<S>;
  } = {};

  protected declare readonly Subscription: S;
  protected declare middleware: Middleware;

  constructor(Subscription: S) {
    this.Subscription = Subscription;

    this.middleware = <R extends React.Reducer<any, any>>({
      dispatch,
    }: MiddlewareAPI<R>) => {
      return (next: Dispatch<R>) => (action: React.ReducerAction<R>) => {
        switch (action.type) {
          case SUBSCRIBE_TYPE:
            this.handleSubscribe(action, dispatch);
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
    for (const url in this.subscriptions) {
      this.subscriptions[url].cleanup();
    }
  }

  /** Called when middleware intercepts 'rest-hooks/subscribe' action.
   *
   */
  protected handleSubscribe(action: SubscribeAction, dispatch: Dispatch<any>) {
    const url = action.meta.url;
    const frequency = action.meta.options?.pollFrequency;

    if (url in this.subscriptions) {
      this.subscriptions[url].add(frequency);
    } else {
      this.subscriptions[url] = new this.Subscription(
        {
          schema: action.meta.schema,
          fetch: action.meta.fetch,
          frequency,
          url,
        },
        dispatch,
      ) as InstanceType<S>;
    }
  }

  /** Called when middleware intercepts 'rest-hooks/unsubscribe' action.
   *
   */
  protected handleUnsubscribe(
    action: UnsubscribeAction,
    dispatch: Dispatch<any>,
  ) {
    const url = action.meta.url;
    const frequency = action.meta.options?.pollFrequency;

    /* istanbul ignore else */
    if (url in this.subscriptions) {
      const empty = this.subscriptions[url].remove(frequency);
      if (empty) {
        delete this.subscriptions[url];
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.error(`Mismatched unsubscribe: ${url} is not subscribed`);
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
  getMiddleware<T extends SubscriptionManager<any>>(this: T) {
    return this.middleware;
  }
}
