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

  // key of the fetch in flight, so we only hold previous data while actually loading
  const fetchingKey = shallowRef('');

  const maybeFetch = async () => {
    const currentKey = argsKey.value;
    if (!currentKey) return;
    const meta = responseMeta.value;
    const forceFetch = meta.expiryStatus === ExpiryStatus.Invalid;
    if (Date.now() <= meta.expiresAt && !forceFetch) return;
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
    return maybeFetch();
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

  // While a fetch for new args is in flight (when React's useSuspense would suspend),
  // keep returning the last resolved data. Vue can't re-suspend after setup, so this
  // avoids yielding `undefined` mid-transition. Refetches of the same key still show
  // current store data when there is any.
  let lastData: unknown;
  let lastKey = '';
  const data = computed(() => {
    const meta = responseMeta.value;
    const key = argsKey.value;
    // INVALID symbol (e.g. deleted entity) means no usable data
    const metaData = typeof meta.data === 'symbol' ? undefined : meta.data;
    const loading =
      !!key &&
      fetchingKey.value === key &&
      (lastKey !== key || metaData === undefined) &&
      meta.expiryStatus !== ExpiryStatus.Valid &&
      (meta.expiryStatus === ExpiryStatus.Invalid ||
        Date.now() > meta.expiresAt);
    if (loading) return lastData;
    lastKey = key;
    return (lastData = metaData);
  });

  // Return readonly computed ref - Vue automatically unwraps in templates and reactive contexts
  return readonly(data);
}
