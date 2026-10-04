import { computed, unref, watch } from 'vue';

import { useController, injectState } from '../context.js';

/** Reactive store response for an endpoint and its (possibly reactive) args.
 *
 * Keeps the response's entities from being garbage collected while mounted.
 */
export default function useResponseMeta(endpoint: any, args: any[]) {
  const stateRef = injectState();
  const controller = useController();

  // Track top-level reactive args (Refs are unwrapped). This allows props/refs to trigger updates.
  const resolvedArgs = computed(() => args.map(a => unref(a as any)) as any);

  // Compute a key that changes when args change (including reactive props)
  const argsKey = computed(() =>
    resolvedArgs.value[0] !== null ? endpoint.key(...resolvedArgs.value) : '',
  );

  // Compute response meta reactively so we can respond to store updates
  const responseMeta = computed(() =>
    controller.getResponseMeta(endpoint, ...resolvedArgs.value, stateRef.value),
  );

  // Maintain GC refcounts on data mount/changes
  watch(
    () => responseMeta.value.data,
    (_newVal, _oldVal, onCleanup) => {
      onCleanup(responseMeta.value.countRef());
    },
    { immediate: true },
  );

  return { controller, stateRef, resolvedArgs, argsKey, responseMeta };
}
