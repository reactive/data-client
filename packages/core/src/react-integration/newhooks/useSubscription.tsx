import {
  EndpointInterface,
  Schema,
  FetchFunction,
} from '@rest-hooks/normalizr';
import { useEffect } from 'react';

import useController from '../hooks/useController.js';

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
    // typescript cannot infer truthy key means args is not null
    const cleanedArgs = args as readonly [...Parameters<E>];

    controller.subscribe(endpoint, ...cleanedArgs);
    return () => {
      controller.unsubscribe(endpoint, ...cleanedArgs);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, key]);
}
