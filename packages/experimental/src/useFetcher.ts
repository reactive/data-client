import { EndpointInterface } from '@rest-hooks/endpoint';
import { DispatchContext } from '@rest-hooks/core';
import { useContext, useCallback } from 'react';

import createFetch from './createFetch';
import { UpdateFunction } from './types';

/**
 * Build an imperative dispatcher to issue network requests.
 * @see https://resthooks.io/docs/api/useFetcher
 */
export default function useFetcher(
  throttle = false,
): <E extends EndpointInterface & { update?: UpdateFunction<E> }>(
  endpoint: E,
  ...args: readonly [...Parameters<E>]
) => ReturnType<E> {
  const dispatch = useContext(DispatchContext);

  return useCallback(
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
}
