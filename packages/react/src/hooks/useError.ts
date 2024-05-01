/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NI, NetworkError, UnknownError } from '@data-client/core';
import { EndpointInterface } from '@data-client/core';

import useCacheState from './useCacheState.js';
import useController from '../hooks/useController.js';

export type ErrorTypes = NetworkError | UnknownError;

/**
 * Get any errors for a given request
 * @see https://dataclient.io/docs/api/useError
 */
export default function useError<E extends Pick<EndpointInterface, 'key'>>(
  endpoint: E,
  ...args: readonly [...NI<Parameters<E['key']>>] | readonly [null]
): ErrorTypes | undefined {
  const state = useCacheState();

  const controller = useController();

  return controller.getError(endpoint, ...args, state);
}
