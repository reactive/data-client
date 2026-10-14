import { NetworkManager } from '@data-client/core';

import idleCallback from '../idleCallback.native.js';

/** Can help prevent stuttering by waiting for idle for sideEffect free fetches */
export default class NativeIdlingNetworkManager extends NetworkManager {
  /** Calls the callback when client is not 'busy' with high priority interaction tasks
   *
   * Override for platform-specific implementations
   */
  protected idleCallback(
    callback: (...args: any[]) => void,
    options?: IdleRequestOptions,
  ) {
    idleCallback(callback, options);
  }
}
