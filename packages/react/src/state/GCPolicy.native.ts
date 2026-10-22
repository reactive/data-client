import { GCPolicy } from '@data-client/core';

import idleCallback from '../idleCallback.native.js';

/** Can help prevent stuttering by waiting for idle before performing GC sweeps */
export default class NativeGCPolicy extends GCPolicy {
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
