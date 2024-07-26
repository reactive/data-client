/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {
  DenormalizeNullable,
  NI,
  Queryable,
  SchemaArgs,
} from '@data-client/core';
import { useMemo } from 'react';

import useCacheState from './useCacheState.js';
import useController from './useController.js';

/**
 * Query the store.
 *
 * `useQuery` results are globally memoized.
 * @see https://dataclient.io/docs/api/useQuery
 */
export default function useQuery<S extends Queryable>(
  schema: S,
  ...args: NI<SchemaArgs<S>>
  // INVALID results in undefined regardless of DenormalizeNullable
): DenormalizeNullable<S> | undefined {
  const state = useCacheState();
  const controller = useController();

  const key = JSON.stringify(args);

  // even though controller.get() is memoized, its memoization is more complex than
  // this so we layer it up to improve rerenders
  return useMemo(() => {
    return controller.get(schema, ...args, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.indexes, state.entities, key]);
}
