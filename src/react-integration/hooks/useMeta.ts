import { useContext, useMemo } from 'react';

import { RequestShape } from '../../resource';
import { StateContext } from '../context';
import { selectMeta } from '../../state/selectors';

/** Gets meta for a url. */
export default function useMeta<Params extends Readonly<object>>(
  { getUrl }: Pick<RequestShape<any, any, Params>, 'getUrl'>,
  params: Params | null,
) {
  const state = useContext(StateContext);
  const url = params ? getUrl(params) : '';

  return useMemo(() => {
    if (!params) return null;
    return selectMeta(state, url);
  }, [state, url]);
}
