import { useContext, useCallback } from 'react';

import { DispatchContext } from '~/react-integration/context';
import { RESET_TYPE } from '~/actionTypes';

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
