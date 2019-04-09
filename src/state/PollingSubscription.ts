import { Schema } from '../resource';
import { Subscription, SubscriptionInit } from './SubscriptionManager';

function min(iter: IterableIterator<number>) {
  let ret = Infinity;
  for (const n of iter) {
    if (n < ret) ret = n;
  }
  return ret;
}

/**
 * PollingSubscription keeps a given resource updated by
 * dispatching a fetch at a rate equal to the minimum update
 * interval requested.
 */
export default class PollingSubscription implements Subscription {
  protected readonly schema: Schema;
  protected readonly fetch: () => Promise<any>;
  protected readonly url: string;
  protected frequency: number;
  protected frequencyHistogram: Map<number, number> = new Map();
  protected dispatch: React.Dispatch<any>;
  protected intervalId?: NodeJS.Timeout;
  protected lastIntervalId?: NodeJS.Timeout;

  constructor(
    { url, schema, fetch, frequency }: SubscriptionInit,
    dispatch: React.Dispatch<any>,
  ) {
    if (frequency === undefined)
      throw new Error('frequency needed for polling subscription');
    this.schema = schema;
    this.fetch = fetch;
    this.frequency = frequency;
    this.url = url;
    this.frequencyHistogram.set(this.frequency, 1);
    this.dispatch = dispatch;
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
          this.frequency = min(this.frequencyHistogram.keys());
          this.run();
        }
      }
    } else if (process.env.NODE_ENV !== 'production') {
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
  }

  /** Trigger request for latest resource */
  protected update() {
    this.dispatch({
      type: 'fetch',
      payload: this.fetch,
      meta: {
        schema: this.schema,
        url: this.url,
        responseType: 'receive',
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

  /** Run polling process with current frequency
   *
   * Will clean up old poll interval on next run
   */
  protected run() {
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
}
