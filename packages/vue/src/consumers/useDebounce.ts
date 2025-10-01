import { ref, watch, onUnmounted, type Ref } from 'vue';

/**
 * Keeps value updated after delay time
 *
 * @see https://dataclient.io/docs/api/useDebounce
 * @param value Any immutable value (can be a ref)
 * @param delay Time in milliseconds to wait til updating the value
 * @param updatable Whether to update at all
 * @example
 ```
 const [debouncedQuery, isPending] = useDebounce(query, 200);
 const list = useSuspense(getThings, { query: debouncedQuery.value });
 ```
 */
export default function useDebounce<T>(
  value: T | Ref<T>,
  delay: number,
  updatable: boolean | Ref<boolean> = true,
): [Ref<T>, Ref<boolean>] {
  const debouncedValue = ref(
    typeof value === 'object' && value !== null && 'value' in value ?
      value.value
    : value,
  ) as Ref<T>;
  const isPending = ref(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const clearExistingTimeout = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  // Watch the input value and debounce updates
  watch(
    [
      () =>
        typeof value === 'object' && value !== null && 'value' in value ?
          value.value
        : value,
      () =>
        (
          typeof updatable === 'object' &&
          updatable !== null &&
          'value' in updatable
        ) ?
          updatable.value
        : updatable,
      () => delay,
    ],
    ([newValue, isUpdatable]) => {
      clearExistingTimeout();

      if (!isUpdatable) {
        isPending.value = false;
        return;
      }

      isPending.value = true;

      timeoutId = setTimeout(() => {
        debouncedValue.value = newValue;
        isPending.value = false;
        timeoutId = null;
      }, delay);
    },
    { immediate: false },
  );

  // Cleanup on unmount
  onUnmounted(() => {
    clearExistingTimeout();
  });

  return [debouncedValue, isPending];
}
