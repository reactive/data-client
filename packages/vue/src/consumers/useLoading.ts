import { ref, onUnmounted, type Ref } from 'vue';

/**
 * Takes an async function and tracks resolution as a boolean.
 *
 * @see https://dataclient.io/docs/api/useLoading
 * @param func A function returning a promise
 * @example
 ```
 function Button({ onClick, children, ...props }) {
   const [clickHandler, loading] = useLoading(onClick);
   return h('button', { onClick: clickHandler, ...props }, 
     loading.value ? 'Loading...' : children
   );
 }
 ```
 */
export default function useLoading<F extends (...args: any) => Promise<any>>(
  func: F,
): [F, Ref<boolean>, Ref<Error | undefined>] {
  const loading = ref(false);
  const error = ref<undefined | Error>(undefined);
  const isMounted = ref(true);

  onUnmounted(() => {
    isMounted.value = false;
  });

  // Create the wrapped function directly - no need for computed in Vue
  const wrappedFunc = (async (...args: any) => {
    loading.value = true;
    error.value = undefined;
    let ret;
    try {
      ret = await func(...args);
    } catch (e: any) {
      error.value = e;
    } finally {
      if (isMounted.value) {
        loading.value = false;
      }
    }
    return ret;
  }) as F;

  return [wrappedFunc, loading, error];
}
