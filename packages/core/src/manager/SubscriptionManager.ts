import { SUBSCRIBE, UNSUBSCRIBE } from '../actionTypes.js';
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

/** Handles subscription actions -> fetch or set actions
 *
 * Constructor takes a SubscriptionConstructable class to control how
 * subscriptions are handled. (e.g., polling, websockets)
 *
 * @see https://dataclient.io/docs/api/SubscriptionManager
 */
export default class SubscriptionManager<
  S extends SubscriptionConstructable = SubscriptionConstructable,
> implements Manager<Actions>
{
  protected subscriptions: {
    [key: string]: InstanceType<S>;
  } = {};

  protected declare readonly Subscription: S;
  protected controller: Controller = new Controller();

  constructor(Subscription: S) {
    this.Subscription = Subscription;
  }

  middleware: Middleware = controller => {
    this.controller = controller;
    return next => action => {
      switch (action.type) {
        case SUBSCRIBE:
          try {
            this.handleSubscribe(action);
          } catch (e) {
            console.error(e);
          }
          return Promise.resolve();
        case UNSUBSCRIBE:
          this.handleUnsubscribe(action);
          return Promise.resolve();
        default:
          return next(action);
      }
    };
  };

  /** Ensures all subscriptions are cleaned up. */
  cleanup() {
    for (const key in this.subscriptions) {
      this.subscriptions[key].cleanup();
    }
  }

  /** Called when middleware intercepts 'rdc/subscribe' action.
   *
   */
  protected handleSubscribe(action: SubscribeAction) {
    const key = action.key;

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

  /** Called when middleware intercepts 'rdc/unsubscribe' action.
   *
   */
  protected handleUnsubscribe(action: UnsubscribeAction) {
    const key = action.key;

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
}
