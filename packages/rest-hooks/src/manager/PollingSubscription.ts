import { actionTypes, Dispatch, Schema, State } from '@rest-hooks/core';
import {
  Subscription,
  SubscriptionInit,
} from 'rest-hooks/manager/SubscriptionManager';
import DefaultConnectionListener from 'rest-hooks/manager/DefaultConnectionListener';
import ConnectionListener from 'rest-hooks/manager/ConnectionListener';

const { FETCH_TYPE } = actionTypes;

/**
 * PollingSubscription keeps a given resource updated by
 * dispatching a fetch at a rate equal to the minimum update
 * interval requested.
 */
export default class PollingSubscription implements Subscription {
  protected declare readonly schema: Schema | undefined;
  protected declare readonly fetch: () => Promise<any>;
  protected declare readonly key: string;
  protected declare frequency: number;
  protected frequencyHistogram: Map<number, number> = new Map();
  protected declare dispatch: Dispatch<any>;
  protected declare getState: () => State<unknown>;
  protected declare intervalId?: ReturnType<typeof setInterval>;
  protected declare lastIntervalId?: ReturnType<typeof setInterval>;
  protected declare startId?: ReturnType<typeof setTimeout>;
  private declare connectionListener: ConnectionListener;

  constructor(
    { key, schema, fetch, frequency, getState }: SubscriptionInit,
    dispatch: Dispatch<any>,
    connectionListener?: ConnectionListener,
  ) {
    if (frequency === undefined)
      throw new Error('frequency needed for polling subscription');
    this.schema = schema;
    this.fetch = fetch;
    this.frequency = frequency;
    this.key = key;
    this.frequencyHistogram.set(this.frequency, 1);
    this.dispatch = dispatch;
    this.getState = getState;
    this.connectionListener =
      connectionListener || new DefaultConnectionListener();

    // Kickstart running since this is initialized after the online notif is sent
    if (this.connectionListener.isOnline()) {
      this.onlineListener();
    } else {
      this.offlineListener();
    }
  }

  /** Subscribe to a frequency */
  add(frequency?: number) {
    if (frequency === undefined) return;
    if (this.frequencyHistogram.has(frequency)) {
      this.frequencyHistogram.set(
        frequency,
        (this.frequencyHistogram.get(frequency) as number) + 1,
      );
    } else {
      this.frequencyHistogram.set(frequency, 1);

      // new min so restart service
      if (frequency < this.frequency) {
        this.frequency = frequency;
        this.run();
      }
    }
  }

  /** Unsubscribe from a frequency */
  remove(frequency?: number) {
    if (frequency === undefined) return false;
    if (this.frequencyHistogram.has(frequency)) {
      this.frequencyHistogram.set(
        frequency,
        (this.frequencyHistogram.get(frequency) as number) - 1,
      );
      if ((this.frequencyHistogram.get(frequency) as number) < 1) {
        this.frequencyHistogram.delete(frequency);

        // nothing subscribed to this anymore...it is invalid
        if (this.frequencyHistogram.size === 0) {
          this.cleanup();
          return true;
        }

        // this was the min, so find the next size
        if (frequency <= this.frequency) {
          this.frequency = Math.min(...this.frequencyHistogram.keys());
          this.run();
        }
      }
    } /* istanbul ignore next */ else if (
      process.env.NODE_ENV !== 'production'
    ) {
      console.error(
        `Mismatched remove: ${frequency} is not subscribed for ${this.key}`,
      );
    }
    return false;
  }

  /** Cleanup means clearing out background interval. */
  cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    if (this.lastIntervalId) {
      clearInterval(this.lastIntervalId);
      this.lastIntervalId = undefined;
    }
    if (this.startId) {
      clearTimeout(this.startId);
      delete this.startId;
    }
    this.connectionListener.removeOnlineListener(this.onlineListener);
    this.connectionListener.removeOfflineListener(this.offlineListener);
  }

  /** Trigger request for latest resource */
  protected update() {
    this.dispatch({
      type: FETCH_TYPE,
      payload: this.fetch,
      meta: {
        schema: this.schema,
        key: this.key,
        type: 'read',
        throttle: true,
        options: {
          dataExpiryLength: this.frequency / 2,
          errorExpiryLength: this.frequency / 10,
          // never break when data already exists
          errorPolicy: () => 'soft' as const,
        },
        createdAt: new Date(),
        resolve: () => {},
        reject: () => {},
      },
    });
  }

  /** What happens when browser goes offline */
  protected offlineListener = () => {
    // this clears existing listeners, so no need to clear offline listener
    this.cleanup();
    this.connectionListener.addOnlineListener(this.onlineListener);
  };

  /** What happens when browser comes online */
  protected onlineListener = () => {
    this.connectionListener.removeOnlineListener(this.onlineListener);
    const now = Date.now();
    this.startId = setTimeout(() => {
      delete this.startId;
      this.update();
      this.run();
    }, Math.max(0, this.lastFetchTime() - now + this.frequency));
    this.connectionListener.addOfflineListener(this.offlineListener);
  };

  /** Run polling process with current frequency
   *
   * Will clean up old poll interval on next run
   */
  protected run() {
    if (this.startId) return;
    this.lastIntervalId = this.intervalId;
    this.intervalId = setInterval(() => {
      // since we don't know how long into the last poll it was before resetting
      // we wait til the next fetch to clear old intervals
      if (this.lastIntervalId) {
        clearInterval(this.lastIntervalId);
        this.lastIntervalId = undefined;
      }
      this.update();
    }, this.frequency);
  }

  /** Last fetch time */
  protected lastFetchTime() {
    return this.getState().meta[this.key]?.date ?? 0;
  }
}
