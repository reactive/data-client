import { useContext, useMemo } from 'react';

import { FetchShape } from '~/resource';
import { StateContext } from '~/react-integration/context';
import { selectMeta } from '~/state/selectors';

/** Gets meta for a url. */
export default function useMeta<Params extends Readonly<object>>(
  { getFetchKey }: Pick<FetchShape<any, any, Params>, 'getFetchKey'>,
  params: Params | null,
) {
  const state = useContext(StateContext);
  const url = params ? getFetchKey(params) : '';

  return useMemo(() => {
    if (!url) return null;
    return selectMeta(state, url);
  }, [url, state]);
}
