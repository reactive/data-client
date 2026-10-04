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
    () => {
      // errors are stored and surfaced through the returned ref
      maybeFetch().catch(() => {});
    },
  );

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
  // keep the same object when nothing changed, so readers only re-run on real changes
  let lastResult: { data?: unknown; error?: unknown } = {};
  const settle = (data: unknown, error?: unknown) =>
    lastResult.data === data && lastResult.error === error ?
      lastResult
    : (lastResult = { data, error });
  const result = computed(() => {
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
    if (loading) return settle(lastData);
    // surface fetch errors for the current args like React's useSuspense does
    const error = controller.getError(
      endpoint,
      ...resolvedArgs.value,
      stateRef.value,
    );
    if (error) return settle(undefined, error);
    lastKey = key;
    return settle((lastData = metaData));
  });

  // Throw on every read; a computed that throws would return its cached value on the next read
  const data = customRef(() => ({
    get() {
      const { data, error } = result.value;
      if (error) throw error;
      return data;
    },
    set() {},
  }));

  // Return readonly ref - Vue automatically unwraps in templates and reactive contexts
  return readonly(data);
}
