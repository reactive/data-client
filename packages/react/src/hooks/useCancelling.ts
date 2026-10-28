import type { EndpointInterface } from '@data-client/core';
import { useRef } from 'react';

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
  const latest = useRef<{
    key: string;
    abort: AbortController;
    endpoint: E;
  }>(undefined);

  // send abort signal anytime the params change
  // if fetch is already completed signal goes nowhere
  const key = args[0] !== null ? endpoint.key(...args) : '';
  // kept in a ref, not useMemo: a render that suspends never commits its
  // memo, so its retry would rebuild it and abort its own fetch
  if (latest.current?.key !== key) {
    latest.current?.abort.abort();
    const abort = new AbortController();
    latest.current = {
      key,
      abort,
      endpoint: endpoint.extend({ signal: abort.signal }),
    };
  }
  return latest.current.endpoint;
}
