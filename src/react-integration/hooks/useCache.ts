import { useContext, useMemo } from 'react';

import { ReadShape, Schema } from '../../resource';
import { makeSchemaSelector } from '../../state/selectors';
import { StateContext } from '../context';

/** Access a resource if it is available. */
export default function useCache<
  Params extends Readonly<object>,
  S extends Schema
>({ schema, getUrl }: ReadShape<S, Params, any>, params: Params | null) {
  const state = useContext(StateContext);
  const select = makeSchemaSelector(schema, getUrl);
  // TODO: if this is identical to before and render was triggered by state update,
  // we should short-circuit entire rest of render
  const resource = useMemo(() => params && select(state, params), [
    select,
    state,
    params && getUrl(params),
  ]);
  return resource;
}
