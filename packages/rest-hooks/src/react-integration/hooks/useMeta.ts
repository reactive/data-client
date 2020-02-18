import { FetchShape } from 'rest-hooks/resource';
import { StateContext } from 'rest-hooks/react-integration/context';
import { selectMeta } from 'rest-hooks/state/selectors';
import { useContext, useMemo } from 'react';

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
