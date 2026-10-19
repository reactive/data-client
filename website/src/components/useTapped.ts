import { useCallback, useEffect, useRef, useState } from 'react';

/** A flag that turns itself off `ms` after `set()`, like a tooltip a tap shows
 * for a moment on touch screens, which can't hover */
export default function useTapped(ms = 2000) {
  const [on, setOn] = useState(false);
  const timeout = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timeout.current), []);
  const set = useCallback(() => {
    setOn(true);
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setOn(false), ms);
  }, [ms]);
  const clear = useCallback(() => {
    window.clearTimeout(timeout.current);
    setOn(false);
  }, []);
  return [on, set, clear] as const;
}
