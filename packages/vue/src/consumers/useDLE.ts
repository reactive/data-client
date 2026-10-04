import type {
  Denormalize,
  DenormalizeNullable,
  ErrorTypes,
  EndpointInterface,
  FetchFunction,
  Schema,
  ResolveType,
} from '@data-client/core';
import { computed, watch, markRaw, type ComputedRef } from 'vue';

import type {
  MaybeRefsOrGetters,
  MaybeRefsOrGettersNullable,
} from '../types.js';
import refetchTriggers from './refetchTriggers.js';
import useCacheResponse from './useCacheResponse.js';

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
  const {
    controller,
    stateRef,
    resolvedArgs,
    argsKey,
    responseMeta,
    forceFetch,
    loading,
    data,
  } = useCacheResponse(endpoint, args);

  // Trigger fetch when necessary
  watch(
    refetchTriggers(responseMeta, stateRef, argsKey),
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
