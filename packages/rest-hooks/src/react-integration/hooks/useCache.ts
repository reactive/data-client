import { useContext } from 'react';

import { StateContext } from '~/react-integration/context';
import { ReadShape, ParamsFromShape } from '~/resource';
import { useDenormalized } from '~/state/selectors';

/** Access a resource if it is available. */
export default function useCache<
  Shape extends Pick<ReadShape<any, any>, 'getFetchKey' | 'schema'>
>(fetchShape: Shape, params: ParamsFromShape<Shape> | null) {
  const state = useContext(StateContext);
  return useDenormalized(fetchShape, params, state)[0];
}
