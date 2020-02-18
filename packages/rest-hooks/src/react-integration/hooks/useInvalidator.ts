import { useContext, useCallback, useRef } from 'react';
import { ReadShape, Schema } from 'rest-hooks/resource';
import { DispatchContext } from 'rest-hooks/react-integration/context';
import { INVALIDATE_TYPE } from 'rest-hooks/actionTypes';

/** Invalidate a certain item within the cache */
export default function useInvalidator<
  Params extends Readonly<object>,
  S extends Schema
>(fetchShape: ReadShape<S, Params>): (params: Params | null) => void {
  const dispatch = useContext(DispatchContext);
  const getFetchKeyRef = useRef(fetchShape.getFetchKey);
  getFetchKeyRef.current = fetchShape.getFetchKey;

  const invalidateDispatcher = useCallback(
    (params: Params | null) => {
      if (!params) return;
      dispatch({
        type: INVALIDATE_TYPE,
        meta: {
          url: getFetchKeyRef.current(params),
        },
      });
    },
    [dispatch],
  );

  return invalidateDispatcher;
}
