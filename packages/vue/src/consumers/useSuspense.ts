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
  customRef,
  unref,
  watch,
  readonly,
  shallowRef,
  type DeepReadonly,
  type ComputedRef,
} from 'vue';

import { useController, injectState } from '../context.js';
import type {
  MaybeRefsOrGetters,
  MaybeRefsOrGettersNullable,
} from '../types.js';
import refetchTriggers from './refetchTriggers.js';

/**
 * Ensure an endpoint is available.
 * Suspends until it is.
 *
 * @see https://dataclient.io/docs/api/useSuspense
 * @throws {Promise} If data is not yet available.
 * @throws {NetworkError} If fetch fails.
 */
export default function useSuspense<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGetters<Parameters<E>>
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
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
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

  // key of the fetch in flight; staleness alone isn't reactive (time passes without a
  // refetch), so only hold previous data while a fetch is actually running
  const fetchingKey = shallowRef('');

  const maybeFetch = async () => {
    const currentKey = argsKey.value;
    if (!currentKey) return;
    if (!isStale(responseMeta.value)) return;
    fetchingKey.value = currentKey;
    try {
      await controller.fetch(endpoint, ...resolvedArgs.value);
    } finally {
      // store updates synchronously before fetch resolves, so data is ready here
      if (fetchingKey.value === currentKey) fetchingKey.value = '';
    }
  };

  // Watch for changes to key, expiry, or store state that require refetch
  watch(refetchTriggers(responseMeta, stateRef, argsKey), () => {
    // errors are stored and surfaced through the returned ref
    maybeFetch().catch(() => {});
  });

  // Maintain GC refcounts on data mount/changes
  watch(
    () => responseMeta.value.data,
    (_newVal, _oldVal, onCleanup) => {
      const decrement = responseMeta.value.countRef();
      onCleanup(() => decrement?.());
    },
    { immediate: true },
  );

  // Trigger on initial call
  await maybeFetch();

  // While a fetch for new args (or for a key with no data) is in flight, where React's
  // useSuspense would suspend, keep returning the last resolved data. Vue can't re-suspend
  // after setup, so this avoids yielding `undefined` mid-transition. A key that already
  // has data keeps showing current store data, even while stale or refetching.
  let lastData: unknown;
  let lastKey = '';
  const loading = computed(() => {
    const meta = responseMeta.value;
    const key = argsKey.value;
    return (
      !!key &&
      fetchingKey.value === key &&
      (lastKey !== key || meta.data === undefined) &&
      meta.expiryStatus !== ExpiryStatus.Valid &&
      isStale(meta)
    );
  });
  // surface fetch errors for the current args like React's useSuspense does
  const error = computed(() =>
    loading.value ? undefined : (
      controller.getError(endpoint, ...resolvedArgs.value, stateRef.value)
    ),
  );
  const data = computed(() => {
    if (loading.value || error.value) return lastData;
    lastKey = argsKey.value;
    return (lastData = responseMeta.value.data);
  });

  // Throw on every read; a computed that throws would return its cached value on the next read
  const result = customRef(() => ({
    get() {
      if (error.value) throw error.value;
      return data.value;
    },
    set() {},
  }));

  // Return readonly ref - Vue automatically unwraps in templates and reactive contexts
  return readonly(result);
}

/** Hard invalid data must refetch regardless of staleness */
function isStale(meta: { expiryStatus: ExpiryStatus; expiresAt: number }) {
  return (
    meta.expiryStatus === ExpiryStatus.Invalid || Date.now() > meta.expiresAt
  );
}
