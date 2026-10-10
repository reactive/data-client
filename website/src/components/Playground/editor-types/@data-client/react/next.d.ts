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
declare function useDebounce<T>(value: T, delay: number, updatable?: boolean): [T, boolean];

export { useDebounce };
