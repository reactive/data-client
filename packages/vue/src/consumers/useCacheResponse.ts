import { ExpiryStatus } from '@data-client/core';
import { computed } from 'vue';

import useExpired from './useExpired.js';
import useResponseMeta from './useResponseMeta.js';

/** Reactive store response shared by useCache() and useDLE().
 *
 * `data` excludes cached entities while useSuspense() would suspend.
 */
export default function useCacheResponse(endpoint: any, args: any[]) {
  const { controller, stateRef, resolvedArgs, argsKey, responseMeta } =
    useResponseMeta(endpoint, args);

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
    loading,
    data,
  };
}
