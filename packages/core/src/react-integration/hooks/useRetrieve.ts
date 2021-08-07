import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint/index';
import { useContext, useMemo } from 'react';
import useFetchDispatcher from '@rest-hooks/core/react-integration/hooks/useFetchDispatcher';
import useExpiresAt from '@rest-hooks/core/react-integration/hooks/useExpiresAt';
import { StateContext } from '@rest-hooks/core/react-integration/context';

/**
 * Request a resource if it is not in cache.\
 * @see https://resthooks.io/docs/api/useRetrieve
 */
export default function useRetrieve<Shape extends ReadShape<any, any>>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape> | null,
  triggerFetch = false,
  entitiesExpireAt = 0,
) {
  const dispatchFetch: any = useFetchDispatcher(true);
  const expiresAt = useExpiresAt(fetchShape, params, entitiesExpireAt);
  const { lastReset } = useContext(StateContext);

  console.log(lastReset);
  return useMemo(() => {
    console.log('running memo', Date.now() <= expiresAt && !triggerFetch);
    // null params mean don't do anything
    if ((Date.now() <= expiresAt && !triggerFetch) || !params) return;
    console.log('this hsould dispatch', new Date());
    return dispatchFetch(fetchShape, params);
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    expiresAt,
    dispatchFetch,
    params && fetchShape.getFetchKey(params),
    triggerFetch,
    lastReset,
  ]);
}
