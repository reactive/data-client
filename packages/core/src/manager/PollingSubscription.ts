import type { EndpointInterface } from '@data-client/normalizr';

import ConnectionListener from './ConnectionListener.js';
import DefaultConnectionListener from './DefaultConnectionListener.js';
import type { Subscription } from './SubscriptionManager.js';
import type Controller from '../controller/Controller.js';
import type { SubscribeAction } from '../types.js';

/**
 * PollingSubscription keeps a given resource updated by
 * dispatching a fetch at a rate equal to the minimum update
 * interval requested.
 *
 * @see https://dataclient.io/docs/api/PollingSubscription
 */
export default class PollingSubscription implements Subscription {
  protected declare readonly endpoint: EndpointInterface;
  protected declare readonly args: readonly any[];
  protected declare readonly key: string;
  protected declare frequency: number;
  protected frequencyHistogram: Map<number, number> = new Map();
  protected declare controller: Controller;
  protected declare intervalId?: ReturnType<typeof setInterval>;
  protected declare lastIntervalId?: ReturnType<typeof setInterval>;
  protected declare startId?: ReturnType<typeof setTimeout>;
  private declare connectionListener: ConnectionListener;

  constructor(
    action: Omit<SubscribeAction, 'type'>,
    controller: Controller,
    connectionListener?: ConnectionListener,
  ) {
    if (action.endpoint.pollFrequency === undefined)
      throw new Error('frequency needed for polling subscription');
    this.endpoint = action.endpoint;
    this.frequency = action.endpoint.pollFrequency;
    this.args = action.meta.args;
    this.key = action.meta.key;
    this.frequencyHistogram.set(this.frequency, 1);
    this.controller = controller;
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
      delete this.intervalId;
    }
    if (this.lastIntervalId) {
      clearInterval(this.lastIntervalId);
      delete this.lastIntervalId;
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
    const sup = this.endpoint;
    const endpoint = function (this: any, ...args: any[]) {
      return sup.call(this, ...args);
    };
    Object.assign(endpoint, this.endpoint);
    endpoint.dataExpiryLength = this.frequency / 2;
    endpoint.errorExpiryLength = this.frequency / 10;
    endpoint.errorPolicy = () => 'soft' as const;
    endpoint.key = () => this.key;
    // stop any errors here from bubbling
    this.controller.fetch(endpoint, ...this.args).catch(() => null);
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
    this.startId = setTimeout(
      () => {
        if (this.startId) {
          delete this.startId;
          this.update();
          this.run();
        } else if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `Poll setTimeout for ${this.key} still running, but timeoutId deleted`,
          );
        }
      },
      Math.max(0, this.lastFetchTime() - now + this.frequency),
    );
    this.connectionListener.addOfflineListener(this.offlineListener);
  };

  /** Run polling process with current frequency
   *
   * Will clean up old poll interval on next run
   */
  protected run() {
    if (this.startId) return;
    if (this.intervalId) this.lastIntervalId = this.intervalId;
    this.intervalId = setInterval(() => {
      // since we don't know how long into the last poll it was before resetting
      // we wait til the next fetch to clear old intervals
      if (this.lastIntervalId) {
        clearInterval(this.lastIntervalId);
        delete this.lastIntervalId;
      }
      if (this.intervalId) this.update();
      else if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Poll intervalId for ${this.key} still running, but intervalId deleted`,
        );
      }
    }, this.frequency);
  }

  /** Last fetch time */
  protected lastFetchTime() {
    return this.controller.getState().meta[this.key]?.date ?? 0;
  }
}
