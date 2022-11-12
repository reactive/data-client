import { useContext, useCallback } from 'react';
import { DispatchContext, actionTypes } from '@rest-hooks/react';

import { ReadShape, ParamsFromShape } from '../endpoint/index.js';

const { INVALIDATE_TYPE } = actionTypes;

/** Invalidate a certain item within the cache
 * @deprecated use https://resthooks.io/docs/api/Controller#invalidate
 */
export default function useInvalidateDispatcher(): <
  Shape extends ReadShape<any, any>,
>(
  fetchShape: Shape,
  params: ParamsFromShape<Shape>,
) => void {
  const dispatch = useContext(DispatchContext);

  const invalidateDispatcher = useCallback(
    <Shape extends ReadShape<any, any>>(
      fetchShape: Shape,
      params: ParamsFromShape<Shape>,
    ) => {
      dispatch({
        type: INVALIDATE_TYPE,
        meta: {
          key: fetchShape.getFetchKey(params),
        },
      });
    },
    [dispatch],
  );

  return invalidateDispatcher;
}
