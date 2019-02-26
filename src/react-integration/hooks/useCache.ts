import { useContext, useMemo } from 'react';

import { ReadShape, Schema } from '../../resource';
import { StateContext } from '../context';

/** Access a resource if it is available. */
export default function useCache<
Params extends Readonly<object>,
S extends Schema,
>({ select, getUrl }: ReadShape<Params, any, S>, params: Params | null) {
  const state = useContext(StateContext);
  // TODO: if this is identical to before and render was triggered by state update,
  // we should short-circuit entire rest of render
  const resource = useMemo(() => params && select(state, params), [
    state,
    params && getUrl(params),
  ]);
  return resource;
}
