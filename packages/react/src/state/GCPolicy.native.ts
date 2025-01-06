import { GCPolicy } from '@data-client/core';
import { InteractionManager } from 'react-native';

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
    InteractionManager.runAfterInteractions(callback);
    if (options?.timeout) {
      InteractionManager.setDeadline(options.timeout);
    }
  }
}
