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
): E['schema'] extends undefined | null ? ReturnType<E> & { resolved: boolean }
: Promise<Denormalize<E['schema']>> & { resolved: boolean };

export default function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
): E['schema'] extends undefined | null ?
  (ReturnType<E> & { resolved: boolean }) | undefined
: | (Promise<DenormalizeNullable<E['schema']>> & { resolved: boolean })
  | undefined;

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

  const lastPromise = ref<(Promise<any> & { resolved: boolean }) | undefined>(
    undefined,
  );
  let lastKey = '';

  const maybeFetch = () => {
    const key = argsKey.value;
    if (!key) {
      lastPromise.value = undefined;
      lastKey = '';
      return;
    }
    const meta = responseMeta.value;
    const forceFetch = meta.expiryStatus === ExpiryStatus.Invalid;

    if (Date.now() > meta.expiresAt || forceFetch) {
      const promise = controller.fetch(
        endpoint,
        ...resolvedArgs.value,
      ) as Promise<any> & { resolved: boolean };
      promise.resolved = false;
      promise.then(
        () => {
          promise.resolved = true;
        },
        () => {
          promise.resolved = true;
        },
      );
      lastPromise.value = promise;
      lastKey = key;
    } else if (!lastPromise.value || lastKey !== key) {
      const promise = Promise.resolve() as Promise<void> & {
        resolved: boolean;
      };
      promise.resolved = true;
      lastPromise.value = promise;
      lastKey = key;
    }
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
