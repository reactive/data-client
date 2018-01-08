import { useContext, useMemo } from 'react';

import { RequestShape, SelectReturn, ParamArg } from '../../resource';
import { StateContext } from '../context';

/** Access a resource if it is available. */
export default function useSelect<
S extends RequestShape<P1, P2>,
P1 extends object,
P2 extends object
>({ select, getUrl }: S, params: ParamArg<S> | null): SelectReturn<S> {
  const state = useContext(StateContext);
  // TODO: if this is identical to before and render was triggered by state update,
  // we should short-circuit entire rest of render
  const resource = useMemo(() => params && select(state, params), [
    state,
    params && getUrl(params),
  ]);
  return resource;
}
