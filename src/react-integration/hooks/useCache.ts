import { useContext } from 'react';

import { StateContext } from '~/react-integration/context';
import { ReadShape, Schema } from '~/resource';
import { useSchemaSelect } from '~/state/selectors';

/** Access a resource if it is available. */
export default function useCache<
  Params extends Readonly<object>,
  S extends Schema
>(
  fetchShape: Pick<ReadShape<S, Params, any>, 'schema' | 'getFetchKey'>,
  params: Params | null,
) {
  const state = useContext(StateContext);
  return useSchemaSelect(fetchShape, state, params);
}
