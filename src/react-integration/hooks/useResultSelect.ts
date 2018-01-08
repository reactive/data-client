import { useContext, useMemo } from 'react';

import { RequestShape, ParamArg } from '../../resource';
import { StateContext } from '../context';
import { makeResults } from '../../state/selectors';

type Resolved<P extends Promise<any>> = P extends Promise<infer R> ? R : any;

/** Access result body if available.
 *
 * Useful for retrieving response meta-data like pagination info
 */
export default function useResultSelect<
S extends RequestShape<P1, P2>,
P1 extends object,
P2 extends object,
D extends object
>(
  { getUrl }: S,
  params: ParamArg<S> | null,
  defaults?: D
): D extends undefined ? Resolved<ReturnType<S['fetch']>> | null : Readonly<D> {
  const state = useContext(StateContext);
  const resultSelector = useMemo(() => makeResults((p: P1) => getUrl(p)), [
    getUrl,
  ]);
  const results = useMemo(() => params && resultSelector(state, params), [
    state,
    params && getUrl(params),
  ]);
  if (defaults && !results) {
    return defaults as any;
  }
  return results as any;
}
