import { NetworkManager } from '@data-client/core';

export default class WebNetworkManager extends NetworkManager {
  static {
    if (typeof requestIdleCallback === 'function') {
      WebNetworkManager.prototype.idleCallback = requestIdleCallback.bind(
        typeof window !== 'undefined' ? window : globalThis,
      );
    }
  }
}
