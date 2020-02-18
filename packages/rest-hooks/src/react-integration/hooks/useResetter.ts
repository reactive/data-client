import { DispatchContext } from 'rest-hooks/react-integration/context';
import { RESET_TYPE } from 'rest-hooks/actionTypes';
import { useContext, useCallback } from 'react';

/** Returns a function to completely clear the cache of all entries */
export default function useResetter(): () => void {
  const dispatch = useContext(DispatchContext);

  const resetDispatcher = useCallback(() => {
    dispatch({
      type: RESET_TYPE,
    });
  }, [dispatch]);

  return resetDispatcher;
}
