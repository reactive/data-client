import { DispatchContext, actionTypes } from '@rest-hooks/react';
import { useContext, useCallback } from 'react';

const { RESET_TYPE } = actionTypes;

/**
 * Returns a function to completely clear the cache of all entries
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
