import type {
  EndpointInterface,
  Schema,
  FetchFunction,
} from '@data-client/core';
import { computed, toValue, watch } from 'vue';

import { useController } from '../context.js';
import type { MaybeRefsOrGettersNullable } from '../types.js';

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
>(
  endpoint: E,
  ...args: MaybeRefsOrGettersNullable<Parameters<E>> | readonly [null]
) {
  const controller = useController();

  // Track top-level reactive args (refs and getters are resolved). This allows props/refs/getters to trigger resubscribe.
  const resolvedArgs = computed(() => args.map(a => toValue(a)) as any);
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
