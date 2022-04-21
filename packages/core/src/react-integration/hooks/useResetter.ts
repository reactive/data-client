import { useContext, useCallback } from 'react';

import { DispatchContext } from '../context.js';
import { RESET_TYPE } from '../../actionTypes.js';

/**
 * Returns a function to completely clear the cache of all entries
 * @deprecated use https://resthooks.io/docs/api/Controller#resetEntireStore
 */
export default function useResetter(): () => void {
  const dispatch = useContext(DispatchContext);

  const resetDispatcher = useCallback(() => {
    dispatch({
      type: RESET_TYPE,
      date: Date.now(),
    });
  }, [dispatch]);

  return resetDispatcher;
}
