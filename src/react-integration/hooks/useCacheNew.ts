import { useContext } from 'react';

import { StateContext } from '~/react-integration/context';
import { ReadShape, Schema } from '~/resource';
import { useDenormalized } from '~/state/selectors';

/** Access a resource if it is available. */
export default function useCacheNew<
  Params extends Readonly<object>,
  S extends Schema
>(
  fetchShape: Pick<ReadShape<S, Params>, 'schema' | 'getFetchKey'>,
  params: Params | null,
) {
  const state = useContext(StateContext);
  return useDenormalized(fetchShape, params, state)[0];
}
