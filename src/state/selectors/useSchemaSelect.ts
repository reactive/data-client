import { useMemo } from 'react';
import { State } from '~/types';
import { SchemaOf, ReadShape } from '~/resource/types';
import { Schema } from '~/resource/normal';
import getEntityPath from './getEntityPath';
import useDenormalizedLegacy from './useDenormalizedLegacy';

export default function useSchemaSelect<
  Params extends Readonly<object>,
  S extends Schema
>(
  { schema, getFetchKey }: Pick<ReadShape<S, Params>, 'schema' | 'getFetchKey'>,
  params: Params | null,
  state: State<any>,
): typeof params extends null ? null : (SchemaOf<typeof schema> | null) {
  const denormalized: any = useDenormalizedLegacy(
    { schema, getFetchKey },
    params,
    state,
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getItemsFromResults = useMemo(() => resultFinderFromSchema(schema), []);
  const output = useMemo(
    () =>
      getItemsFromResults && denormalized
        ? getItemsFromResults(denormalized)
        : denormalized,
    [denormalized, getItemsFromResults],
  );
  if (output === undefined) return null as any;
  return output;
}

// TODO: there should honestly be a way to use the pre-existing normalizr object
// to not even need this implementation
export function resultFinderFromSchema<S extends Schema>(
  schema: S,
): null | ((results: any) => SchemaOf<S>) {
  const path = getEntityPath(schema);
  if (path === false)
    throw new Error('Schema invalid - no path to entity found');
  if (path.length === 0) return null;
  return results => {
    let cur = results;
    for (const p of path) {
      cur = cur[p];
    }
    return cur;
  };
}
