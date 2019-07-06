import { useContext, useMemo } from 'react';

import { FetchShape } from '~/resource';
import { StateContext } from '~/react-integration/context';
import { selectMeta } from '~/state/selectors';

/** Gets meta for a url. */
export default function useMeta<Params extends Readonly<object>>(
  { getUrl }: Pick<FetchShape<any, any, Params>, 'getUrl'>,
  params: Params | null,
) {
  const state = useContext(StateContext);
  const url = params ? getUrl(params) : '';

  return useMemo(() => {
    if (!url) return null;
    return selectMeta(state, url);
  }, [url, state]);
}
