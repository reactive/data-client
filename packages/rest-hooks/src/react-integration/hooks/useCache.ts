import { StateContext } from 'rest-hooks/react-integration/context';
import { ReadShape, ParamsFromShape } from 'rest-hooks/resource';
import { useDenormalized } from 'rest-hooks/state/selectors';
import { useContext } from 'react';

/** Access a resource if it is available. */
export default function useCache<
  Shape extends Pick<ReadShape<any, any>, 'getFetchKey' | 'schema'>
>(fetchShape: Shape, params: ParamsFromShape<Shape> | null) {
  const state = useContext(StateContext);
  return useDenormalized(fetchShape, params, state)[0];
}
