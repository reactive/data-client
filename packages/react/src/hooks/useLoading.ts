import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Takes an async function and tracks resolution as a boolean.
 *
 * If `func` rejects, the error is stored and cleared again on the next call.
 * When calls overlap, `loading` and `error` follow the latest one.
 *
 * @see https://dataclient.io/docs/api/useLoading
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
  // a hidden <Activity> runs effect cleanups but keeps state; loading is cleared once shown again
  const settledWhileHiddenRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    if (settledWhileHiddenRef.current) {
      settledWhileHiddenRef.current = false;
      setLoading(false);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const latestCallRef = useRef(0);
  const depsList = deps || [func];
  const wrappedFunc = useCallback(async (...args: any) => {
    const callId = ++latestCallRef.current;
    settledWhileHiddenRef.current = false;
    setLoading(true);
    setError(undefined);
    let ret;
    // only the latest call updates loading and error; every call still returns its result
    try {
      ret = await func(...args);
    } catch (e: any) {
      // not gated on mount, so an error that lands while <Activity> is hidden still shows
      if (callId === latestCallRef.current) setError(e);
    } finally {
      if (callId === latestCallRef.current) {
        if (isMountedRef.current) setLoading(false);
        else settledWhileHiddenRef.current = true;
      }
    }
    return ret;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, depsList);
  return [wrappedFunc as any, loading, error];
}
