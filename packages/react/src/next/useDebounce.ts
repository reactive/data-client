import { useEffect, useState, useTransition } from 'react';

/**
 * Keeps value updated after delay time
 *
 * @see https://dataclient.io/docs/api/useDebounce
 * @param value Any immutable value
 * @param delay Time in miliseconds to wait til updating the value
 * @param updatable Whether to update at all
 * @example
 ```
 const [debouncedQuery, isPending] = useDebounce(query, 200);
 const list = useSuspense(getThings, { query: debouncedQuery });
 ```
 */
export default function useDebounce<T>(
  value: T,
  delay: number,
  updatable = true,
): [T, boolean] {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isPending, startTransition] = useTran();

  useEffect(() => {
    if (!updatable) return;

    const handler = setTimeout(() => {
      startTransition(() => setDebouncedValue(value));
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, updatable]);

  return [debouncedValue, isPending];
}

// compatibility with older react versions
const useTran = useTransition ?? (() => [false, identityRun]);
const identityRun = (fun: (...args: any) => any) => fun();
