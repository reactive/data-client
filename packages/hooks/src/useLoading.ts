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
export default function useLoading<
  F extends (...args: any) => Promise<any>,
  E extends Error,
>(func: F, deps: readonly any[] = []): [F, boolean, E | undefined] {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<undefined | E>(undefined);
  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );
  const wrappedFunc = useCallback(
    async (...args: any) => {
      setLoading(true);
      let ret;
      try {
        ret = await func(...args);
      } catch (e: any) {
        setError(e);
        throw e;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
      return ret;
    },
    [func, ...deps],
  );
  return [wrappedFunc as any, loading, error];
}
