/** Defers low-priority work until the JS thread is idle
 *
 * @returns cancels the callback if it has not yet run
 */
export default function runWhenIdle(callback: () => void): () => void {
  // @react-native/jest-preset runs in a plain Node environment without requestIdleCallback
  if (typeof requestIdleCallback === 'function') {
    const handle = requestIdleCallback(callback);
    return () => cancelIdleCallback(handle);
  }
  const handle = setTimeout(callback, 0);
  return () => clearTimeout(handle);
}
