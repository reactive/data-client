import { useCallback, useRef } from 'react';
import { ReadShape } from '@rest-hooks/core/endpoint';
import { Schema } from '@rest-hooks/endpoint';

import useInvalidateDispatcher from './useInvalidateDispatcher';

/** Invalidate a certain item within the cache */
export default function useInvalidator<
  Params extends Readonly<object>,
  S extends Schema
>(fetchShape: ReadShape<S, Params>): (params: Params | null) => void {
  const dispatch = useInvalidateDispatcher();
  const fetchShapeRef = useRef(fetchShape);
  fetchShapeRef.current = fetchShape;

  const invalidateDispatcher = useCallback(
    (params: any) => {
      if (!params) return;
      dispatch(fetchShapeRef.current, params);
    },
    [dispatch],
  );

  return invalidateDispatcher;
}
