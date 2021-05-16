import { useContext, useCallback } from 'react';
import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint';
import { Schema } from '@rest-hooks/endpoint';
import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import { INVALIDATE_TYPE } from '@rest-hooks/core/actionTypes';

/** Invalidate a certain item within the cache */
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
