import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint/index';
import { useMemo } from 'react';
import { EndpointInterface, Schema, FetchFunction } from '@rest-hooks/endpoint';
import useSubscriptionNew from '@rest-hooks/core/react-integration/newhooks/useSubscription';
import shapeToEndpoint from '@rest-hooks/core/endpoint/adapter';

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
