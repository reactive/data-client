import { useEffect, useState, useRef, useCallback } from 'react';

/** Takes an async function and tracks resolution as a boolean.
 *
 * @param func A function returning a promise
 * @param onError Callback in case of error (optional)
 *
 * Usage:
 * function Button({ onClick, children, ...props }) {
 *   const [clickHandler, loading] = useLoading(onClick);
 *   return (
 *     <button onClick={clickHandler} {...props}>
 *       {loading ? 'Loading...' : children}
 *     </button>
 *   );
 * }
 */
export default function useLoading<F extends (...args: any) => Promise<any>>(
  func: F,
  onError?: (error: Error) => void,
): [F, boolean] {
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );
  const wrappedClick = useCallback(
    async (...args: any) => {
      setLoading(true);
      let ret;
      try {
        ret = await func(...args);
      } catch (e) {
        if (onError) onError(e);
        throw e;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
      return ret;
    },
    [onError, func],
  );
  return [wrappedClick as any, loading];
}
