import { SUBSCRIBE_TYPE, UNSUBSCRIBE_TYPE } from '../actionTypes.js';
import Controller from '../controller/Controller.js';
import type {
  Manager,
  MiddlewareAPI,
  Middleware,
  UnsubscribeAction,
  SubscribeAction,
} from '../types.js';

type Actions = UnsubscribeAction | SubscribeAction;

/** Interface handling a single resource subscription */
export interface Subscription {
  add(frequency?: number): void;
  remove(frequency?: number): boolean;
  cleanup(): void;
}

/** The static class that constructs Subscription */
export interface SubscriptionConstructable {
  new (
    action: Omit<SubscribeAction, 'type'>,
    controller: Controller,
  ): Subscription;
}

/** Handles subscription actions -> fetch or receive actions
 *
 * Constructor takes a SubscriptionConstructable class to control how
 * subscriptions are handled. (e.g., polling, websockets)
 *
 * @see https://dataclient.io/docs/api/SubscriptionManager
 */
export default class SubscriptionManager<S extends SubscriptionConstructable>
  implements Manager<Actions>
{
  protected subscriptions: {
    [key: string]: InstanceType<S>;
  } = {};

  protected declare readonly Subscription: S;
  protected declare middleware: Middleware;
  protected controller: Controller = new Controller();

  constructor(Subscription: S) {
    this.Subscription = Subscription;

    this.middleware = <C extends MiddlewareAPI>(controller: C) => {
      this.controller = controller;
      return (next: C['dispatch']): C['dispatch'] =>
        action => {
          switch (action.type) {
            case SUBSCRIBE_TYPE:
              try {
                this.handleSubscribe(action);
              } catch (e) {
                console.error(e);
              }
              return Promise.resolve();
            case UNSUBSCRIBE_TYPE:
              this.handleUnsubscribe(action);
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
  protected handleSubscribe(action: SubscribeAction) {
    const key = action.meta.key;

    if (key in this.subscriptions) {
      const frequency = action.endpoint.pollFrequency;
      this.subscriptions[key].add(frequency);
    } else {
      this.subscriptions[key] = new this.Subscription(
        action,
        this.controller,
      ) as InstanceType<S>;
    }
  }

  /** Called when middleware intercepts 'rest-hooks/unsubscribe' action.
   *
   */
  protected handleUnsubscribe(action: UnsubscribeAction) {
    const key = action.meta.key;

    /* istanbul ignore else */
    if (key in this.subscriptions) {
      const frequency = action.endpoint.pollFrequency;
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
