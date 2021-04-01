import { useContext, useCallback } from 'react';
import { ReadShape } from '@rest-hooks/core/endpoint';
import { Schema } from '@rest-hooks/endpoint';
import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import { INVALIDATE_TYPE } from '@rest-hooks/core/actionTypes';

/** Invalidate a certain item within the cache */
export default function useInvalidateDispatcher(): <
  Params extends Readonly<object>
>(
  fetchShape: ReadShape<Schema, Params>,
  params: Params,
) => void {
  const dispatch = useContext(DispatchContext);

  const invalidateDispatcher = useCallback(
    <Params extends Readonly<object>>(
      fetchShape: ReadShape<Schema, Params>,
      params: Params,
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
