import { SUBSCRIBE, UNSUBSCRIBE } from '../actionTypes.js';
import Controller from '../controller/Controller.js';
import type {
  Manager,
  Middleware,
  UnsubscribeAction,
  SubscribeAction,
} from '../types.js';

type Actions = UnsubscribeAction | SubscribeAction;

/** Interface handling a single resource subscription */
export interface Subscription {
  add(frequency?: number): void;
  remove(frequency?: number): boolean;
  /** Stops background work, like timers. `init()` may resume it. */
  cleanup(): void;
  /** Resumes background work stopped by `cleanup()`. Does nothing while already running. */
  init?(): void;
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
> implements Manager<Actions> {
  protected subscriptions: {
    [key: string]: InstanceType<S>;
  } = {};

  declare protected readonly Subscription: S;
  protected controller: Controller = new Controller();
  /** Between `cleanup()` and `init()`: subscriptions are tracked but do not run. */
  protected paused = false;

  constructor(Subscription: S) {
    this.Subscription = Subscription;
  }

  middleware: Middleware = controller => {
    // Managers shared by a remounted DataProvider: subscriptions from the old store
    // would keep fetching for it, so drop them
    if (controller !== this.controller) {
      for (const key in this.subscriptions) {
        this.subscriptions[key].cleanup();
      }
      this.subscriptions = {};
    }
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

  /** Resumes every subscription stopped by `cleanup()`. */
  init() {
    this.paused = false;
    for (const key in this.subscriptions) {
      this.subscriptions[key].init?.();
    }
  }

  /** Pauses every subscription. They stay tracked, so `init()` resumes them. */
  cleanup() {
    this.paused = true;
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
      const subscription = new this.Subscription(
        action,
        this.controller,
      ) as InstanceType<S>;
      // a subscription starts in its constructor; while paused it waits for init().
      // One without init() could never resume, so it keeps running.
      if (this.paused && subscription.init) subscription.cleanup();
      this.subscriptions[key] = subscription;
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
