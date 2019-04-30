import { useContext, useCallback } from 'react';

import { ReadShape, Schema } from '../../resource';
import { DispatchContext } from '../context';

/** Invalidate a certain item within the cache */
export default function useInvalidator<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
>(selectShape: ReadShape<S, Params, Body>, params: Params | null) {
  const { getUrl } = selectShape;
  const dispatch = useContext(DispatchContext);

  const invalidateDispatcher = useCallback(() => {
    if (!params) return;
    dispatch({
      type: 'rest-hooks/invalidate',
      meta: {
        url: getUrl(params),
      },
    });
  }, [params, getUrl, dispatch]);

  return invalidateDispatcher;
}
