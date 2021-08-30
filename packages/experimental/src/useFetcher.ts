import { EndpointInterface } from '@rest-hooks/endpoint';

import { UpdateFunction } from './types';
import useController from './useController';

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
  return useController({ throttle }).fetch;
}
