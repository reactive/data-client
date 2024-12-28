import type { EndpointInterface } from '@data-client/core';
import { useMemo, useRef } from 'react';

/**
 * Builds an Endpoint that cancels fetch everytime params change
 *
 * @see https://dataclient.io/docs/api/useCancelling
 * @example
 ```
 useSuspense(useCancelling(MyEndpoint, { id }), { id })
 ```
 */
export default function useCancelling<
  E extends EndpointInterface & {
    extend: (o: { signal?: AbortSignal }) => any;
  },
>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E {
  const abortRef = useRef<AbortController>(undefined);

  // send abort signal anytime the params change
  // if fetch is already completed signal goes nowhere
  const key = args[0] !== null ? endpoint.key(...args) : '';
  return useMemo(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    return endpoint.extend({
      signal: abortRef.current.signal,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
