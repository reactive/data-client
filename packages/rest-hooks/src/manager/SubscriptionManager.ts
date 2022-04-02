import {
  MiddlewareAPI,
  Middleware,
  Dispatch,
  SubscribeAction,
  UnsubscribeAction,
  Manager,
  actionTypes,
  Schema,
  State,
} from '@rest-hooks/core';

const { SUBSCRIBE_TYPE, UNSUBSCRIBE_TYPE } = actionTypes;

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

    this.middleware = <R extends React.Reducer<any, any>>({
      dispatch,
      getState,
    }: MiddlewareAPI<R>) => {
      return (next: Dispatch<R>) => (action: React.ReducerAction<R>) => {
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
    dispatch: Dispatch<any>,
    getState: () => State<unknown>,
  ) {
    const key = action.meta.key;
    const frequency = action.meta.options?.pollFrequency;

    if (key in this.subscriptions) {
      this.subscriptions[key].add(frequency);
    } else {
      this.subscriptions[key] = new this.Subscription(
        {
          schema: action.meta.schema,
          fetch: action.meta.fetch,
          frequency,
          key,
          getState,
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
  getMiddleware<T extends SubscriptionManager<any>>(this: T) {
    return this.middleware;
  }
}
