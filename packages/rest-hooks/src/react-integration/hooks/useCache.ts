import { StateContext } from 'rest-hooks/react-integration/context';
import { ReadShape, ParamsFromShape } from 'rest-hooks/resource';
import { useDenormalized } from 'rest-hooks/state/selectors';
import { useContext, useMemo } from 'react';

import useExpiresAt from './useExpiresAt';

/** Access a resource if it is available. */
export default function useCache<
  Shape extends Pick<ReadShape<any, any>, 'getFetchKey' | 'schema'>
>(fetchShape: Shape, params: ParamsFromShape<Shape> | null) {
  const expiresAt = useExpiresAt(fetchShape, params);
  // This computation reflects the behavior of useResource/useRetrive
  // It only changes the value when expiry or params change.
  // This way, random unrelated re-renders don't cause the concept of expiry
  // to change
  const expired = useMemo(() => {
    if (Date.now() <= expiresAt || !params) return false;
    return true;
    // we need to check against serialized params, since params can change frequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, params && fetchShape.getFetchKey(params)]);

  const state = useContext(StateContext);
  return useDenormalized(fetchShape, params, state, expired)[0];
}
