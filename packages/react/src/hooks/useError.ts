/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NetworkError, UnknownError } from '@data-client/core';
import { EndpointInterface } from '@data-client/core';

import useCacheState from './useCacheState.js';
import useController from '../hooks/useController.js';

export type ErrorTypes = NetworkError | UnknownError;

type UseErrorReturn<P> = P extends [null] ? undefined : ErrorTypes | undefined;

/**
 * Get any errors for a given request
 * @see https://dataclient.io/docs/api/useError
 */
export default function useError<
  E extends Pick<EndpointInterface, 'key'>,
  Args extends readonly [...Parameters<E['key']>] | readonly [null],
>(endpoint: E, ...args: Args): UseErrorReturn<Args> {
  const state = useCacheState();

  const controller = useController();

  return controller.getError(endpoint, ...args, state) as any;
}
