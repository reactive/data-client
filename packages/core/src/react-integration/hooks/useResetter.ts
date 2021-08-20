import { DispatchContext } from '@rest-hooks/core/react-integration/context';
import { RESET_TYPE } from '@rest-hooks/core/actionTypes';
import { useContext, useCallback } from 'react';

/**
 * Returns a function to completely clear the cache of all entries
 * @see https://resthooks.io/docs/api/useResetter
 */
export default function useResetter(): () => void {
  const dispatch = useContext(DispatchContext);

  const resetDispatcher = useCallback(() => {
    dispatch({
      type: RESET_TYPE,
      date: new Date(),
    });
  }, [dispatch]);

  return resetDispatcher;
}
