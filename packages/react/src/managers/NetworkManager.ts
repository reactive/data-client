import { NetworkManager } from '@data-client/core';

export default class WebIdlingNetworkManager extends NetworkManager {
  static {
    if (typeof requestIdleCallback === 'function') {
      WebIdlingNetworkManager.prototype.idleCallback = (...args) =>
        requestIdleCallback(...args);
    }
  }
}
