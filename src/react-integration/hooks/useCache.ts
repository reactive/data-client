import { ReadShape, Schema } from '../../resource';
import { makeSchemaSelector } from '../../state/selectors';
import useSelection from './useSelection';

/** Access a resource if it is available. */
export default function useCache<
Params extends Readonly<object>,
S extends Schema
>({ schema, getUrl }: ReadShape<S, Params, any>, params: Params | null) {
  const select = makeSchemaSelector(schema, getUrl);
  return useSelection(select, params, getUrl);
}
