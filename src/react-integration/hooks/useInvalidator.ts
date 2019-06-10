import { useContext, useCallback, useRef } from 'react';

import { ReadShape, Schema } from '../../resource';
import { DispatchContext } from '../context';

/** Invalidate a certain item within the cache */
export default function useInvalidator<
  Params extends Readonly<object>,
  S extends Schema
>(selectShape: ReadShape<S, Params, any>): (params: Params | null) => void {
  const dispatch = useContext(DispatchContext);
  const getUrlRef = useRef(selectShape.getUrl);
  getUrlRef.current = selectShape.getUrl;

  const invalidateDispatcher = useCallback(
    (params: Params | null) => {
      if (!params) return;
      dispatch({
        type: 'rest-hooks/invalidate',
        meta: {
          url: getUrlRef.current(params),
        },
      });
    },
    [dispatch],
  );

  return invalidateDispatcher;
}
