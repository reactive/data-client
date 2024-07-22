import { NetworkManager } from '@data-client/core';

/** Can help prevent stuttering by waiting for idle for sideEffect free fetches */
export default class WebIdlingNetworkManager extends NetworkManager {
  static {
    if (typeof requestIdleCallback === 'function') {
      WebIdlingNetworkManager.prototype.idleCallback = (...args) =>
        requestIdleCallback(...args);
    }
  }
}
