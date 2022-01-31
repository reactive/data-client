import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import { RESET_TYPE } from '@rest-hooks/core/actionTypes';
import { useContext, useCallback } from 'react';

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
