import { useContext, useMemo } from 'react';

import { RequestShape, ParamArg } from '../../resource';
import { StateContext } from '../context';
import { selectMeta } from '../../state/selectors';

/** Gets meta for a url. */
export default function useMeta<
S extends RequestShape<P1, P2>,
P1 extends object,
P2 extends object
>({ getUrl }: S, params: ParamArg<S> | null) {
  const state = useContext(StateContext);
  const url = params ? getUrl(params) : '';

  return useMemo(() => {
    if (!params) return null;
    return selectMeta(state, url);
  }, [state, url]);
}
