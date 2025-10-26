import { ExpiryStatus } from '@data-client/core';
import type {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
  DenormalizeNullable,
} from '@data-client/core';
import { computed, watch, ref, unref } from 'vue';

import { useController, injectState } from '../context.js';
import type {
  MaybeRefsOrGetters,
  MaybeRefsOrGettersNullable,
} from '../types.js';

/**
 * Fetch an Endpoint if it is not in cache or stale.
 * Non-suspense; returns the fetch Promise when a request is issued, otherwise undefined.
 * Mirrors React useFetch semantics.
 * @see https://dataclient.io/docs/api/useFetch
 */
export default function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGetters<Parameters<E>>
): E['schema'] extends undefined | null ? ReturnType<E>
: Promise<Denormalize<E['schema']>>;

export default function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
): E['schema'] extends undefined | null ? ReturnType<E> | undefined
: Promise<DenormalizeNullable<E['schema']>> | undefined;

export default function useFetch(endpoint: any, ...args: any[]): any {
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

  const lastPromise = ref<Promise<any> | undefined>(undefined);

  const maybeFetch = () => {
    if (!argsKey.value) return;
    const meta = responseMeta.value;
    const forceFetch = meta.expiryStatus === ExpiryStatus.Invalid;
    if (Date.now() <= meta.expiresAt && !forceFetch) return;
    lastPromise.value = controller.fetch(endpoint, ...resolvedArgs.value);
  };

  // Trigger on initial call
  maybeFetch();

  // Also watch for store changes that might require refetch (e.g., invalidation)
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
      maybeFetch();
    },
  );

  return lastPromise;
}
