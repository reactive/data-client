import type { State } from '@data-client/core';
import { computed } from 'vue';
import type { ComputedRef, Ref } from 'vue';

/** Whether the response is expired, re-checked only when expiry, args, or a reset changes.
 *
 * Mirrors the useMemo deps in @data-client/react so unrelated store updates
 * don't re-read Date.now(). Relies on Vue >=3.4 computed stability: the narrow
 * computeds below don't notify `expired` when their value is unchanged.
 */
export default function useExpired(
  responseMeta: Readonly<Ref<{ readonly expiresAt: number }>>,
  stateRef: Readonly<Ref<State<unknown>>>,
  argsKey: Readonly<Ref<string>>,
  forceFetch: Readonly<Ref<boolean>>,
): ComputedRef<boolean> {
  const expiresAt = computed(() => responseMeta.value.expiresAt);
  const lastReset = computed(() => stateRef.value.lastReset);
  return computed(() => {
    // read every source up front so short-circuiting doesn't drop tracking
    const key = argsKey.value;
    const force = forceFetch.value;
    void lastReset.value;
    return !!((Date.now() > expiresAt.value || force) && key);
  });
}
