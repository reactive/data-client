import type {
  EndpointInterface,
  Schema,
  FetchFunction,
} from '@rest-hooks/react';
import { useSubscription as useSubscriptionNew } from '@rest-hooks/react';
import { useMemo } from 'react';

import shapeToEndpoint from '../endpoint/adapter.js';
import { ReadShape, ParamsFromShape } from '../endpoint/index.js';

/**
 * Keeps a resource fresh by subscribing to updates.
 * @see https://resthooks.io/docs/api/useSubscription
 */
export default function useSubscription<
  E extends
    | EndpointInterface<FetchFunction, Schema | undefined, undefined | false>
    | ReadShape<any, any>,
  Args extends
    | (E extends (...args: any) => any
        ? readonly [...Parameters<E>]
        : readonly [ParamsFromShape<E>])
    | readonly [null],
>(endpoint: E, ...args: Args) {
  const adaptedEndpoint: any = useMemo(() => {
    return shapeToEndpoint(endpoint);
    // we currently don't support shape changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useSubscriptionNew(adaptedEndpoint, ...args);
}
