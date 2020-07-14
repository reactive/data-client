import { useContext, useCallback, useRef } from 'react';
import { Schema } from '@rest-hooks/normalizr';
import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import { INVALIDATE_TYPE } from '@rest-hooks/core/actionTypes';
import { ReadEndpoint } from '@rest-hooks/endpoint';

/** Invalidate a certain item within the cache */
export default function useInvalidator<
  Params extends Readonly<object>,
  S extends Schema
>(
  fetchShape: ReadEndpoint<(params?: Params) => Promise<any>, S>,
): (params: Params | null) => void {
  const dispatch = useContext(DispatchContext);
  const getFetchKeyRef = useRef(fetchShape.key);
  getFetchKeyRef.current = fetchShape.key;

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
