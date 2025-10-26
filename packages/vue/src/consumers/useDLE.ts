import type {
  Denormalize,
  DenormalizeNullable,
  ErrorTypes,
  EndpointInterface,
  FetchFunction,
  Schema,
  ResolveType,
} from '@data-client/core';
import { ExpiryStatus } from '@data-client/core';
import { computed, unref, watch, markRaw, type ComputedRef } from 'vue';

import { useController, injectState } from '../context.js';
import type {
  MaybeRefsOrGetters,
  MaybeRefsOrGettersNullable,
} from '../types.js';

/**
 * Use async data with { data, loading, error } (DLE)
 * @see https://dataclient.io/docs/api/useDLE
 */
export default function useDLE<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGetters<Parameters<E>>
): {
  data: ComputedRef<
    E['schema'] extends undefined | null ? ResolveType<E> | undefined
    : Denormalize<E['schema']> | DenormalizeNullable<E['schema']>
  >;
  loading: ComputedRef<boolean>;
  error: ComputedRef<ErrorTypes | undefined>;
};

export default function useDLE<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
): {
  data: ComputedRef<
    E['schema'] extends undefined | null ? undefined
    : DenormalizeNullable<E['schema']>
  >;
  loading: ComputedRef<boolean>;
  error: ComputedRef<ErrorTypes | undefined>;
};

export default function useDLE(endpoint: any, ...args: any[]): any {
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
  const expired = computed(() => {
    return !!(
      (Date.now() > responseMeta.value.expiresAt || forceFetch.value) &&
      argsKey.value
    );
  });

  // fully "valid" data will not suspend/loading even if it is not fresh
  const loading = computed(() => {
    return !!(
      responseMeta.value.expiryStatus !== ExpiryStatus.Valid && expired.value
    );
  });
  /****************************************************************************************************/

  // Trigger fetch when necessary
  watch(
    () => {
      const m = responseMeta.value;
      return [
        m.expiresAt,
        m.expiryStatus,
        stateRef.value.lastReset,
        argsKey.value,
      ];
    },
    async () => {
      const currentKey = argsKey.value;
      if (!currentKey) return;
      const meta = responseMeta.value;
      const force = forceFetch.value;
      if (Date.now() <= meta.expiresAt && !force) return;
      await controller.fetch(endpoint, ...resolvedArgs.value).catch(() => {});
    },
    { immediate: true },
  );

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

  const error = computed(() => {
    return controller.getError(endpoint, ...resolvedArgs.value, stateRef.value);
  });

  // Use markRaw to prevent Vue from auto-unwrapping the computed refs
  return markRaw({
    data,
    loading,
    error,
  });
}
