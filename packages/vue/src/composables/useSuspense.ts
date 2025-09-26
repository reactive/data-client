import { ExpiryStatus } from '@data-client/core';
import type {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
  DenormalizeNullable,
  ResolveType,
} from '@data-client/core';
import { computed, watch, type ComputedRef } from 'vue';

import { injectController, injectState } from '../context.js';

export default function useSuspense<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>]
): Promise<
  E['schema'] extends undefined | null ? ComputedRef<ResolveType<E>>
  : ComputedRef<Denormalize<E['schema']>>
>;

export default function useSuspense<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>] | readonly [null]
): Promise<
  E['schema'] extends undefined | null ? ComputedRef<ResolveType<E> | undefined>
  : ComputedRef<DenormalizeNullable<E['schema']>>
>;

export default async function useSuspense(
  endpoint: any,
  ...args: any[]
): Promise<ComputedRef<any>> {
  const stateRef = injectState();
  const controller = injectController();

  const key = args[0] !== null ? endpoint.key(...args) : '';
  const responseMeta = computed(() =>
    controller.getResponseMeta(endpoint, ...args, stateRef.value),
  );

  // If invalid or expired, perform fetch and await it to integrate with Vue Suspense
  const isInvalid =
    responseMeta.value.expiryStatus === ExpiryStatus.Invalid ||
    Date.now() > responseMeta.value.expiresAt;
  if (key && isInvalid) {
    await controller.fetch(endpoint, ...(args as any));
  }

  const error = controller.getError(endpoint, ...args, stateRef.value);
  if (error) throw error;

  // Maintain GC refcounts on data mount/changes
  watch(
    () => responseMeta.value.data,
    (_newVal, _oldVal, onCleanup) => {
      const decrement = responseMeta.value.countRef();
      onCleanup(() => decrement());
    },
    { immediate: true },
  );

  return computed(() => responseMeta.value.data);
}
