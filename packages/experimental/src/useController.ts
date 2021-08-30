import { EndpointInterface } from '@rest-hooks/endpoint';
import { DispatchContext } from '@rest-hooks/core';
import { useContext, useCallback } from 'react';

import createFetch from './createFetch';
import createInvalidate from './createInvalidate';
import createReset from './createReset';
import { UpdateFunction } from './types';

/**
 * Imperative control of Rest Hooks store
 * @see https://resthooks.io/docs/api/useController
 */
export default function useController({
  throttle = false,
}: {
  throttle?: boolean;
} = {}): Controller {
  const dispatch = useContext(DispatchContext);

  // TODO: elevate into CacheProvider and simply useContext
  const fetch = useCallback(
    <E extends EndpointInterface>(
      endpoint: E,
      ...args: readonly [...Parameters<E>]
    ) => {
      const action = createFetch(endpoint, {
        args,
        throttle,
      });
      dispatch(action);

      return action.meta.promise as any;
    },
    [dispatch, throttle],
  );

  const invalidate = useCallback(
    <E extends EndpointInterface>(
      endpoint: E,
      ...args: readonly [...Parameters<E>] | readonly [null]
    ) =>
      args[0] !== null
        ? dispatch(
            createInvalidate(endpoint, {
              args: args as readonly [...Parameters<E>],
            }),
          )
        : Promise.resolve(),
    [dispatch],
  );

  const resetEntireStore = useCallback(
    () => dispatch(createReset()),
    [dispatch],
  );

  return { fetch, invalidate, resetEntireStore };
}

export interface Controller {
  fetch: <E extends EndpointInterface & { update?: UpdateFunction<E> }>(
    endpoint: E,
    ...args: readonly [...Parameters<E>]
  ) => ReturnType<E>;
  invalidate: <E extends EndpointInterface>(
    endpoint: E,
    ...args: readonly [...Parameters<E>] | readonly [null]
  ) => Promise<void>;
  resetEntireStore: () => Promise<void>;
}
