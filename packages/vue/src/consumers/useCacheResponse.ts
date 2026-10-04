import { ExpiryStatus } from '@data-client/core';
import { computed, unref, watch } from 'vue';

import { useController, injectState } from '../context.js';
import useExpired from './useExpired.js';

/** Reactive store response shared by useCache() and useDLE().
 *
 * `data` excludes cached entities while useSuspense() would suspend.
 */
export default function useCacheResponse(endpoint: any, args: any[]) {
  const stateRef = injectState();
  const controller = useController();

  // Track top-level reactive args (Refs are unwrapped). This allows props/refs to trigger updates.
  const resolvedArgs = computed(() => args.map(a => unref(a as any)) as any);

  // Compute a key that changes when args change (including reactive props)
  const argsKey = computed(() =>
    resolvedArgs.value[0] !== null ? endpoint.key(...resolvedArgs.value) : '',
  );

  // Compute response meta reactively so we can respond to store updates
  const responseMeta = computed(() => {
    return controller.getResponseMeta(
      endpoint,
      ...resolvedArgs.value,
      stateRef.value,
    );
  });

  // If we are hard invalid we must fetch regardless of triggering or staleness
  const forceFetch = computed(
    () => responseMeta.value.expiryStatus === ExpiryStatus.Invalid,
  );

  /*********** This block is to ensure results are only filled when they would not suspend **************/
  // This computation reflects the behavior of useSuspense/useFetch
  // It only changes the value when expiry or params change.
  // This way, random unrelated re-renders don't cause the concept of expiry
  // to change
  const expired = useExpired(responseMeta, stateRef, argsKey, forceFetch);

  // fully "valid" data will not suspend/loading even if it is not fresh
  const loading = computed(
    () =>
      responseMeta.value.expiryStatus !== ExpiryStatus.Valid && expired.value,
  );
  /****************************************************************************************************/

  // Maintain GC refcounts on data mount/changes
  watch(
    () => responseMeta.value.data,
    (_newVal, _oldVal, onCleanup) => {
      const decrement = responseMeta.value.countRef();
      onCleanup(() => decrement());
    },
    { immediate: true },
  );

  const data = computed(() => {
    // if useSuspense() would suspend, don't include entities from cache
    if (loading.value) {
      if (!endpoint.schema) return undefined;
      // TODO: use getResponse() once it just returns data
      return controller.getResponseMeta(endpoint, ...resolvedArgs.value, {
        ...stateRef.value,
        entities: {},
      }).data as any;
    }
    return responseMeta.value.data;
  });

  return {
    controller,
    stateRef,
    resolvedArgs,
    argsKey,
    responseMeta,
    forceFetch,
    loading,
    data,
  };
}
