import { useContext, useCallback, useRef } from 'react';
import { ReadShape } from '@rest-hooks/core/endpoint';
import { Schema } from '@rest-hooks/normalizr';
import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import { INVALIDATE_TYPE } from '@rest-hooks/core/actionTypes';

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
          key: getFetchKeyRef.current(params),
        },
      });
    },
    [dispatch],
  );

  return invalidateDispatcher;
}
