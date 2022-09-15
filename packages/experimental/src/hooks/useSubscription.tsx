import { useController } from '@rest-hooks/core';
import {
  EndpointInterface,
  Schema,
  FetchFunction,
} from '@rest-hooks/normalizr';
import { useEffect } from 'react';

/**
 * Keeps a resource fresh by subscribing to updates.
 * @see https://resthooks.io/docs/api/useSubscription
 */
export default function useSubscription<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args) {
  const controller = useController();

  const key = args[0] !== null ? endpoint.key(...args) : '';

  useEffect(() => {
    if (!key) return;

    controller.subscribe(endpoint, ...args);
    return () => {
      controller.unsubscribe(endpoint, ...args);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, key]);
}
