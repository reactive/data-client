import type { EntityPath } from '@data-client/normalizr';

import { REF } from '../../actionTypes.js';
import type { RefAction } from '../../types.js';

export function createCountRef(
  dispatch: (action: RefAction) => void,
  {
    key,
    paths = [],
  }: {
    key: string;
    paths?: EntityPath[];
  },
) {
  return () => {
    dispatch({
      type: REF,
      key,
      paths,
      incr: true,
    });
    return () =>
      dispatch({
        type: REF,
        key,
        paths,
        incr: false,
      });
  };
}
