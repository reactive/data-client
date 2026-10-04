import type { ExpiryStatus, State } from '@data-client/core';
import type { Ref } from 'vue';

/** Watch sources whose changes may require a refetch.
 *
 * Multi-source form so Vue compares each value; a getter returning a new array
 * would fire on every store update and refetch stale data unexpectedly.
 */
export default function refetchTriggers(
  responseMeta: Readonly<
    Ref<{ readonly expiresAt: number; readonly expiryStatus: ExpiryStatus }>
  >,
  stateRef: Readonly<Ref<State<unknown>>>,
  argsKey: Readonly<Ref<string>>,
) {
  return [
    () => responseMeta.value.expiresAt,
    () => responseMeta.value.expiryStatus,
    () => stateRef.value.lastReset,
    argsKey,
  ] as const;
}
