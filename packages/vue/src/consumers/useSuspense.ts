import { ExpiryStatus } from '@data-client/core';
import type {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
  DenormalizeNullable,
  ResolveType,
} from '@data-client/core';
import {
  computed,
  watch,
  readonly,
  type DeepReadonly,
  type ComputedRef,
} from 'vue';

import { useController, injectState } from '../context.js';

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
  DeepReadonly<
    ComputedRef<
      E['schema'] extends undefined | null ? ResolveType<E>
      : Denormalize<E['schema']>
    >
  >
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
  DeepReadonly<
    ComputedRef<
      E['schema'] extends undefined | null ? ResolveType<E> | undefined
      : DenormalizeNullable<E['schema']>
    >
  >
>;

export default async function useSuspense(
  endpoint: any,
  ...args: any[]
): Promise<any> {
  const stateRef = injectState();
  const controller = useController();

  // Compute a key that changes when args change (including reactive props)
  const argsKey = computed(() =>
    args[0] !== null ? endpoint.key(...args) : '',
  );

  // Compute response meta reactively so we can respond to store updates
  const responseMeta = computed(() => {
    return argsKey.value ?
        controller.getResponseMeta(endpoint, ...args, stateRef.value)
      : null;
  });

  const maybeFetch = async () => {
    const currentKey = argsKey.value;
    if (!currentKey) return;
    const meta = responseMeta.value;
    if (!meta) return;
    const forceFetch = meta.expiryStatus === ExpiryStatus.Invalid;
    if (Date.now() <= meta.expiresAt && !forceFetch) return;
    await controller.fetch(endpoint, ...(args as any));
  };

  // Trigger on initial call
  await maybeFetch();

  // Watch for changes to key, expiry, or store state that require refetch
  watch(
    () => {
      const m = responseMeta.value;
      return m ?
          [m.expiresAt, m.expiryStatus, stateRef.value.lastReset, argsKey.value]
        : [argsKey.value];
    },
    () => {
      return maybeFetch();
    },
  );

  // Maintain GC refcounts on data mount/changes
  watch(
    () => responseMeta.value?.data,
    (_newVal, _oldVal, onCleanup) => {
      const decrement = responseMeta.value?.countRef();
      onCleanup(() => decrement?.());
    },
    { immediate: true },
  );

  // Return readonly computed ref - Vue automatically unwraps in templates and reactive contexts
  return readonly(computed(() => responseMeta.value?.data));
}
