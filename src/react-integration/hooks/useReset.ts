import { useContext, useCallback } from 'react';

import { DispatchContext } from '~/react-integration/context';

/** Returns a function to completely clear the cache of all entries */
export default function useReset(): () => void {
  const dispatch = useContext(DispatchContext);

  const resetDispatcher = useCallback(() => {
    dispatch({
      type: 'rest-hooks/reset',
    });
  }, [dispatch]);

  return resetDispatcher;
}
