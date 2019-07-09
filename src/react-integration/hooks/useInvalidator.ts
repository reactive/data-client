import { useContext, useCallback, useRef } from 'react';

import { ReadShape, Schema } from '~/resource';
import { DispatchContext } from '~/react-integration/context';

/** Invalidate a certain item within the cache */
export default function useInvalidator<
  Params extends Readonly<object>,
  S extends Schema
>(selectShape: ReadShape<S, Params, any>): (params: Params | null) => void {
  const dispatch = useContext(DispatchContext);
  const getFetchKeyRef = useRef(selectShape.getFetchKey);
  getFetchKeyRef.current = selectShape.getFetchKey;

  const invalidateDispatcher = useCallback(
    (params: Params | null) => {
      if (!params) return;
      dispatch({
        type: 'rest-hooks/invalidate',
        meta: {
          url: getFetchKeyRef.current(params),
        },
      });
    },
    [dispatch],
  );

  return invalidateDispatcher;
}
