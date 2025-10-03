import { ExpiryStatus } from '@data-client/core';
import type {
  EndpointInterface,
  Denormalize,
  Schema,
  FetchFunction,
  DenormalizeNullable,
} from '@data-client/core';
import { computed, watch } from 'vue';

import { useController, injectState } from '../context.js';

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
  ...args: readonly [...Parameters<E>]
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
  ...args: readonly [...Parameters<E>] | readonly [null]
): E['schema'] extends undefined | null ? ReturnType<E> | undefined
: Promise<DenormalizeNullable<E['schema']>> | undefined;

export default function useFetch(endpoint: any, ...args: any[]): any {
  const stateRef = injectState();
  const controller = useController();

  const key: string = args[0] !== null ? endpoint.key(...args) : '';

  // Compute response meta reactively so we can respond to store updates
  const responseMeta = computed(() =>
    key ? controller.getResponseMeta(endpoint, ...args, stateRef.value) : null,
  );

  let lastPromise: Promise<any> | undefined = undefined;

  const maybeFetch = () => {
    if (!key) return;
    const meta = responseMeta.value;
    if (!meta) return;
    const forceFetch = meta.expiryStatus === ExpiryStatus.Invalid;
    if (Date.now() <= meta.expiresAt && !forceFetch) return;
    lastPromise = controller.fetch(endpoint, ...(args as any));
  };

  // Trigger on initial call
  maybeFetch();

  // Also watch for store changes that might require refetch (e.g., invalidation)
  watch(
    () => {
      const m = responseMeta.value;
      return m ? [m.expiresAt, m.expiryStatus, stateRef.value.lastReset] : key;
    },
    () => {
      maybeFetch();
    },
  );

  return lastPromise;
}
