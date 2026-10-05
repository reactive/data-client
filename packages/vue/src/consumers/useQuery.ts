import type {
  DenormalizeNullable,
  Queryable,
  SchemaArgs,
} from '@data-client/core';
import { computed, toValue, type ComputedRef } from 'vue';

import { useController, injectState } from '../context.js';
import type { MaybeRefsOrGetters } from '../types.js';
import useCountRef from './useCountRef.js';

/**
 * Query the store.
 *
 * `useQuery` results are globally memoized.
 * @see https://dataclient.io/docs/api/useQuery
 */
export default function useQuery<S extends Queryable>(
  schema: S,
  ...args: MaybeRefsOrGetters<SchemaArgs<S>>
): ComputedRef<DenormalizeNullable<S> | undefined>;

export default function useQuery(
  schema: any,
  ...args: any[]
): ComputedRef<unknown> {
  const stateRef = injectState();
  const controller = useController();

  // Track top-level reactive args (refs and getters are resolved). This allows props/refs/getters to trigger updates.
  const resolvedArgs = computed(() => args.map(a => toValue(a)) as any);

  // Compute query meta based on state and args. This mirrors React's memoization
  // that keys off state.entities/indexes and args.
  const queryMeta = computed(() =>
    controller.getQueryMeta(
      schema,
      ...resolvedArgs.value,
      stateRef.value as any,
    ),
  );

  useCountRef(queryMeta);

  return computed(() => queryMeta.value.data);
}
