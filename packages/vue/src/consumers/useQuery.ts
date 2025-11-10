import type {
  DenormalizeNullable,
  Queryable,
  SchemaArgs,
} from '@data-client/core';
import { computed, unref, watch, type ComputedRef } from 'vue';

import { useController, injectState } from '../context.js';
import type { MaybeRefsOrGetters } from '../types.js';

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

export default function useQuery(schema: any, ...args: any[]): any {
  const stateRef = injectState();
  const controller = useController();

  // Track top-level reactive args (Refs are unwrapped). This allows props/refs to trigger updates.
  const resolvedArgs = computed(() => args.map(a => unref(a as any)) as any);

  // Compute query meta based on state and args. This mirrors React's memoization
  // that keys off state.entities/indexes and args.
  const queryMeta = computed(() =>
    controller.getQueryMeta(
      schema,
      ...resolvedArgs.value,
      stateRef.value as any,
    ),
  );

  // Maintain GC refcounts on data mount/changes
  watch(
    () => queryMeta.value.data,
    (_newVal, _oldVal, onCleanup) => {
      const decrement = queryMeta.value.countRef();
      onCleanup(() => decrement());
    },
    { immediate: true },
  );

  return computed(() => queryMeta.value.data);
}
