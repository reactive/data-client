import { useEffect, useState } from 'react';

/**
 * Keeps value updated after delay time
 *
 * @see https://resthooks.io/docs/api/useDebounce
 * @param value Any immutable value
 * @param delay Time in miliseconds to wait til updating the value
 * @param updatable Whether to update at all
 * @example
 ```
 const debouncedFilter = useDebounced(filter, 200);
 const list = useResource(ListShape, { filter });
 ```
 */
export default function useDebounce<T>(
  value: T,
  delay: number,
  updatable = true,
) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (!updatable) return;

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, updatable]);

  return debouncedValue;
}
