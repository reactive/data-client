import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Takes an async function and tracks resolution as a boolean.
 *
 * @see https://resthooks.io/docs/api/useLoading
 * @param func A function returning a promise
 * @param deps Deps list sent to useCallback()
 * @example
 ```
 function Button({ onClick, children, ...props }) {
   const [clickHandler, loading] = useLoading(onClick);
   return (
     <button onClick={clickHandler} {...props}>
       {loading ? 'Loading...' : children}
     </button>
   );
 }
 ```
 */
export default function useLoading<F extends (...args: any) => Promise<any>>(
  func: F,
  deps?: readonly any[],
): [F, boolean, Error | undefined] {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<undefined | Error>(undefined);
  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );
  const depsList = deps || [func];
  const wrappedFunc = useCallback(async (...args: any) => {
    setLoading(true);
    let ret;
    try {
      ret = await func(...args);
    } catch (e: any) {
      setError(e);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
    return ret;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, depsList);
  return [wrappedFunc as any, loading, error];
}
