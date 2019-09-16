import { useContext, useMemo } from 'react';

import { ReadShape } from '~/resource';
import { StateContext } from '~/react-integration/context';

type Resolved<P extends Promise<any>> = P extends Promise<infer R> ? R : any;

// TODO: actually track fetch return type - it's always 'any' now
/** Access result body if available.
 *
 * Useful for retrieving response meta-data like pagination info
 */
export default function useResultCache<
  Params extends Readonly<object>,
  D extends object
>(
  { getFetchKey, fetch }: ReadShape<any, Params, any>,
  params: Params | null,
  defaults?: D,
): D extends undefined
  ? Resolved<ReturnType<typeof fetch>> | null
  : Readonly<D> {
  const state = useContext(StateContext);

  const results: any = params && (state.results[getFetchKey(params)] || null);

  if (defaults && !results) {
    return defaults as any;
  }
  return results;
}
