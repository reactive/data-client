import * as ReactNative from 'react-native';

/** InteractionManager waits for running animations and gestures until React Native 0.82,
 * then became a stub; 0.87 removed it in favor of requestIdleCallback.
 */
const InteractionManager = (() => {
  try {
    return (ReactNative as any).InteractionManager as
      | {
          runAfterInteractions(callback: () => void): { cancel(): void };
          setDeadline(deadline: number): void;
        }
      | undefined;
  } catch {
    // React Native 0.87+ throws in development when accessing the removed export
  }
})();

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
