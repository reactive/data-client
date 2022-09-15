import { useMemo } from 'react';
import {
  EndpointInterface,
  Schema,
  FetchFunction,
} from '@rest-hooks/normalizr';

import shapeToEndpoint from '../../endpoint/adapter.js';
import { ReadShape, ParamsFromShape } from '../../endpoint/index.js';
import useSubscriptionNew from '../newhooks/useSubscription.js';

/**
 * Keeps a resource fresh by subscribing to updates.
 * @see https://resthooks.io/docs/api/useSubscription
 */
export default function useSubscription<
  E extends
    | EndpointInterface<FetchFunction, Schema | undefined, undefined>
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
