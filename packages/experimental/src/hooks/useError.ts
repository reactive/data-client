/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  NetworkError,
  UnknownError,
  StateContext,
  useController,
} from '@rest-hooks/core';
import { EndpointInterface } from '@rest-hooks/normalizr';
import { useContext } from 'react';

export type ErrorTypes = NetworkError | UnknownError;

type UseErrorReturn<P> = P extends null ? undefined : ErrorTypes | undefined;

/**
 * Get any errors for a given request
 * @see https://resthooks.io/docs/api/useError
 */
export default function useError<
  E extends Pick<EndpointInterface, 'key'>,
  Args extends readonly [...Parameters<E['key']>] | readonly [null],
>(endpoint: E, ...args: Args): UseErrorReturn<typeof args[0]> {
  const state = useContext(StateContext);

  const controller = useController();

  // @ts-ignore
  return controller.getError(endpoint, ...args, state) as any;
}
