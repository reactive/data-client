import { Schema } from 'rest-hooks/resource';
import { Dispatch } from '@rest-hooks/use-enhanced-reducer';
import { FETCH_TYPE, RECEIVE_TYPE } from 'rest-hooks/actionTypes';

import isOnline from './isOnline';
import { Subscription, SubscriptionInit } from './SubscriptionManager';

/**
 * PollingSubscription keeps a given resource updated by
 * dispatching a fetch at a rate equal to the minimum update
 * interval requested.
 */
export default class PollingSubscription implements Subscription {
  protected declare readonly schema: Schema;
  protected declare readonly fetch: () => Promise<any>;
  protected declare readonly url: string;
  protected declare frequency: number;
  protected frequencyHistogram: Map<number, number> = new Map();
  protected declare dispatch: Dispatch<any>;
  protected declare intervalId?: NodeJS.Timeout;
  protected declare lastIntervalId?: NodeJS.Timeout;

  constructor(
    { url, schema, fetch, frequency }: SubscriptionInit,
    dispatch: Dispatch<any>,
  ) {
    if (frequency === undefined)
      throw new Error('frequency needed for polling subscription');
    this.schema = schema;
    this.fetch = fetch;
    this.frequency = frequency;
    this.url = url;
    this.frequencyHistogram.set(this.frequency, 1);
    this.dispatch = dispatch;
    if (isOnline()) this.update();
    this.run();
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
        `Mismatched remove: ${frequency} is not subscribed for ${this.url}`,
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
    // react native does not support removeEventListener
    if (typeof addEventListener === 'function') {
      removeEventListener('online', this.onlineListener);
      removeEventListener('offline', this.offlineListener);
    }
  }

  /** Trigger request for latest resource */
  protected update() {
    this.dispatch({
      type: FETCH_TYPE,
      payload: this.fetch,
      meta: {
        schema: this.schema,
        url: this.url,
        responseType: RECEIVE_TYPE,
        throttle: true,
        options: {
          dataExpiryLength: this.frequency / 2,
          errorExpiryLength: this.frequency / 10,
        },
        resolve: () => {},
        reject: () => {},
      },
    });
  }

  /** What happens when browser goes offline */
  protected offlineListener = () => {
    this.cleanup();
    addEventListener('online', this.onlineListener);
  };

  /** What happens when browser comes online */
  protected onlineListener = () => {
    this.update();
    this.run();
  };

  /** Run polling process with current frequency
   *
   * Will clean up old poll interval on next run
   */
  protected run() {
    if (isOnline()) {
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
      // react native does not support addEventListener
      if (typeof addEventListener === 'function')
        addEventListener('offline', this.offlineListener);
    } else {
      addEventListener('online', this.onlineListener);
    }
  }
}
