import type {
  DenormalizeNullable,
  NI,
  Queryable,
  SchemaArgs,
} from '@data-client/core';
import { computed, watch, type ComputedRef } from 'vue';

import { useController, injectState } from '../context.js';

/**
 * Query the store (non-suspense).
 *
 * Returns a readonly computed ref of the query result. The value is undefined when
 * the result is not found or invalid.
 * Mirrors React's useQuery semantics using Vue reactivity.
 * @see https://dataclient.io/docs/api/useQuery
 */
export default function useQuery<S extends Queryable>(
  schema: S,
  ...args: NI<SchemaArgs<S>>
): ComputedRef<DenormalizeNullable<S> | undefined> {
  const stateRef = injectState();
  const controller = useController();

  // Compute query meta based on state and args. This mirrors React's memoization
  // that keys off state.entities/indexes and args.
  const queryMeta = computed(() =>
    controller.getQueryMeta(schema, ...args, stateRef.value as any),
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
