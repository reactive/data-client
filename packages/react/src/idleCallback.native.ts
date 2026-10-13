// default import: a namespace import enumerates (and so evaluates) every react-native export
import ReactNative from 'react-native';

interface InteractionManagerAPI {
  runAfterInteractions(callback: () => void): { cancel(): void };
  setDeadline(deadline: number): void;
}

/** InteractionManager waits for running animations and gestures until React Native 0.82,
 * then became a stub; 0.87 removed it in favor of requestIdleCallback.
 */
let InteractionManager: InteractionManagerAPI | undefined;
try {
  InteractionManager = (ReactNative as any).InteractionManager;
} catch {
  // React Native 0.87+ throws in development when accessing the removed export
}

/** Calls the callback when React Native is not busy, returning a function that cancels it */
export default function idleCallback(
  callback: (...args: any[]) => void,
  options?: IdleRequestOptions,
): () => void {
  if (InteractionManager) {
    const task = InteractionManager.runAfterInteractions(callback);
    if (options?.timeout) InteractionManager.setDeadline(options.timeout);
    return () => task.cancel();
  }
  const handle = requestIdleCallback(callback, options);
  return () => cancelIdleCallback(handle);
}
