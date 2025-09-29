import type {
  EndpointInterface,
  Schema,
  FetchFunction,
} from '@data-client/core';
import { computed, unref, watch } from 'vue';

import { injectController } from '../context.js';

/**
 * Keeps a resource fresh by subscribing to updates.
 * Mirrors React hook API. Pass `null` as first arg to unsubscribe.
 * @see https://dataclient.io/docs/api/useSubscription
 */
export default function useSubscription<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined | false
  >,
>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]) {
  const controller = injectController();

  // Track top-level reactive args (Refs are unwrapped). This allows props/refs to trigger resubscribe.
  const resolvedArgs = computed(() => args.map(a => unref(a as any)) as any);
  const key = computed(() => {
    if (resolvedArgs.value[0] === null) return '';
    return endpoint.key(...(resolvedArgs.value as readonly [...Parameters<E>]));
  });

  // Subscribe when key exists; unsubscribe on change or unmount
  watch(
    key,
    (_newKey, _oldKey, onCleanup) => {
      if (!key.value) return;
      const cleanedArgs = resolvedArgs.value as readonly [...Parameters<E>];
      controller.subscribe(endpoint, ...cleanedArgs);
      onCleanup(() => {
        controller.unsubscribe(endpoint, ...cleanedArgs);
      });
    },
    { immediate: true },
  );
}
