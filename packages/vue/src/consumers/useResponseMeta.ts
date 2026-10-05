import { ExpiryStatus } from '@data-client/core';
import { computed, toValue } from 'vue';

import { useController, injectState } from '../context.js';
import useCountRef from './useCountRef.js';

/** Reactive store response for an endpoint and its (possibly reactive) args.
 *
 * Keeps the response's entities from being garbage collected while mounted.
 */
export default function useResponseMeta(endpoint: any, args: any[]) {
  const stateRef = injectState();
  const controller = useController();

  // Track top-level reactive args (refs and getters are resolved). This allows props/refs/getters to trigger updates.
  const resolvedArgs = computed(() => args.map(a => toValue(a)) as any);

  // Compute a key that changes when args change (including reactive props)
  const argsKey = computed(() =>
    resolvedArgs.value[0] !== null ? endpoint.key(...resolvedArgs.value) : '',
  );

  // Compute response meta reactively so we can respond to store updates
  const responseMeta = computed(() =>
    controller.getResponseMeta(endpoint, ...resolvedArgs.value, stateRef.value),
  );

  useCountRef(responseMeta);

  return { controller, stateRef, resolvedArgs, argsKey, responseMeta };
}

/** Whether a response needs fetching; hard invalid data must refetch regardless of staleness */
export function isStale(meta: {
  expiryStatus: ExpiryStatus;
  expiresAt: number;
}) {
  return (
    meta.expiryStatus === ExpiryStatus.Invalid || Date.now() > meta.expiresAt
  );
}
