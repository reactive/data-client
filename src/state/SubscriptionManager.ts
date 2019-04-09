import { memoize } from 'lodash';
import { MiddlewareAPI, SubscribeAction, UnsubscribeAction } from '../types';
import { Schema } from '../resource';

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
  new (init: SubscriptionInit, dispatch: React.Dispatch<any>): Subscription;
}

/** Handles subscription actions -> fetch or receive actions
 *
 * Constructor takes a SubscriptionConstructable class to control how
 * subscriptions are handled. (e.g., polling, websockets)
 */
export default class SubscriptionManager<S extends SubscriptionConstructable> {
  protected subscriptions: {
    [url: string]: InstanceType<S>;
  } = {};
  protected readonly Subscription: S;

  constructor(Subscription: S) {
    this.Subscription = Subscription;
    this.getMiddleware = memoize(this.getMiddleware);
  }

  /** Ensures all subscriptions are cleaned up. */
  cleanup() {
    for (const url in this.subscriptions) {
      this.subscriptions[url].cleanup();
    }
  }

  /** Called when middleware intercepts 'subscribe' action.
   *
   */
  protected handleSubscribe(
    action: SubscribeAction,
    dispatch: React.Dispatch<any>,
  ) {
    const url = action.meta.url;
    if (url in this.subscriptions) {
      this.subscriptions[url].add(action.meta.frequency);
    } else {
      this.subscriptions[url] = new this.Subscription(
        {
          schema: action.meta.schema,
          fetch: action.meta.fetch,
          frequency: action.meta.frequency,
          url,
        },
        dispatch,
      ) as InstanceType<S>;
    }
  }

  /** Called when middleware intercepts 'unsubscribe' action.
   *
   */
  protected handleUnsubscribe(
    action: UnsubscribeAction,
    dispatch: React.Dispatch<any>,
  ) {
    const url = action.meta.url;
    if (url in this.subscriptions) {
      const empty = this.subscriptions[url].remove(action.meta.frequency);
      if (empty) {
        delete this.subscriptions[url];
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.error(`Mismatched unsubscribe: ${url} is not subscribed`);
    }
  }

  /** Attaches Manager to store
   *
   * Intercepts 'subscribe'/'unsubscribe' to register resources that
   * need to be kept up to date.
   *
   * Will possibly dispatch 'fetch' or 'receive' to keep resources fresh
   *
   */
  getMiddleware<T extends SubscriptionManager<S>>(this: T) {
    return <R extends React.Reducer<any, A>, A extends Actions>({
      dispatch,
    }: MiddlewareAPI<R>) => {
      return (next: React.Dispatch<React.ReducerAction<R>>) => (
        action: Actions,
      ) => {
        switch (action.type) {
        case 'subscribe':
          this.handleSubscribe(action, dispatch);
          return;
        case 'unsubscribe':
          this.handleUnsubscribe(action, dispatch);
          return;
        default:
          return next(action);
        }
      };
    };
  }
}
