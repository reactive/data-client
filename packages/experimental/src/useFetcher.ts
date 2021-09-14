import { EndpointInterface } from '@rest-hooks/endpoint';
import { useController } from '@rest-hooks/core';

import { UpdateFunction } from './types';

/**
 * Build an imperative dispatcher to issue network requests.
 * @see https://resthooks.io/docs/api/useFetcher
 */
export default function useFetcher(): <
  E extends EndpointInterface & { update?: UpdateFunction<E> },
>(
  endpoint: E,
  ...args: readonly [...Parameters<E>]
) => ReturnType<E> {
  return useController().fetch;
}
