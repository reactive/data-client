import type { EndpointParam, EndpointInterface } from '@rest-hooks/endpoint';
import { useMemo, useRef } from 'react';

/**
 * Builds an Endpoint that cancels fetch everytime params change
 *
 * @see https://resthooks.io/docs/api/useCancelling
 * @example
 ```
 useResource(useCancelling(MyEndpoint, { id }), { id })
 ```
 */
export default function useCancelling<
  E extends EndpointInterface & {
    extend: (o: { signal?: AbortSignal | undefined }) => any;
  },
>(endpoint: E, params: EndpointParam<E> | null): E {
  const abortRef = useRef<AbortController>();

  // send abort signal anytime the params change
  // if fetch is already completed signal goes nowhere
  const serializedParams = params && endpoint.key(params);
  return useMemo(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    return endpoint.extend({
      signal: abortRef.current.signal,
    });
  }, [serializedParams]);
}
