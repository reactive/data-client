import { useMemo, useRef, useEffect } from 'react';
import { State } from '~/types';
import { isEntity, SchemaOf, ReadShape } from '~/resource/types';
import { Schema, denormalize } from '~/resource/normal';
import getEntityPath from './getEntityPath';

export function selectMeta<R = any>(state: State<R>, url: string) {
  return state.meta[url];
}

export const makeResults = <R = any>(
  getFetchKey: (...args: any[]) => string,
) => (state: State<R>, params: object) =>
  state.results[getFetchKey(params)] || null;

// TODO: there should honestly be a way to use the pre-existing normalizr object
// to not even need this implementation
function resultFinderFromSchema<S extends Schema>(
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

export function useSchemaSelect<
  Params extends Readonly<object>,
  S extends Schema
>(
  {
    schema,
    getFetchKey,
  }: Pick<ReadShape<S, Params, any>, 'schema' | 'getFetchKey'>,
  state: State<any>,
  params: Params | null,
): SchemaOf<typeof schema> | null {
  // Precompute logic the only changes based on FetchShape
  const [getResultList, dataSchema] = useMemo(() => {
    const getResultList = resultFinderFromSchema(schema);
    const dataSchema = getResultList
      ? getResultList(schema)
      : (schema as SchemaOf<typeof schema>);
    return [getResultList, dataSchema];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectResults = useMemo(() => makeResults<any>(getFetchKey), []);

  // Select from state
  const entities = state.entities;
  let results = params && selectResults(state, params);

  return useMemo(() => {
    if (!entities || !params) return null;
    // We can grab entities without actual results if the params compute a primary key
    // TODO: we should rebuild this to actually construct the results as expected.
    // this will make each piece more composable, which will cleanup the exhaustive-deps workarounds
    let getRequestListForThis = getResultList;
    if (isEntity(dataSchema) && !results) {
      const id = dataSchema.getId(params, undefined, '');
      // in case we don't even have entities for a model yet, denormalize() will throw
      if (
        id !== undefined &&
        id !== '' &&
        entities[dataSchema.key] !== undefined
      ) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        results = id;
        // simplify schema since we already grabbed the id
        // eslint-disable-next-line react-hooks/exhaustive-deps
        schema = dataSchema;
        // don't try to extract for this query
        getRequestListForThis = null;
      }
    }

    // Results are final so guard against null
    if (!results) return null;

    // Warn users with bad configurations
    if (process.env.NODE_ENV !== 'production' && isEntity(schema)) {
      if (Array.isArray(results)) {
        throw new Error(
          `url ${getFetchKey(
            params,
          )} has list results when single result is expected`,
        );
      }
      if (typeof results === 'object') {
        throw new Error(
          `url ${getFetchKey(
            params,
          )} has object results when single result is expected`,
        );
      }
    }

    // Select the actual results now
    let output = denormalize(results, schema, entities);
    if (getRequestListForThis) {
      output = getRequestListForThis(output);
    }
    if (!output) return null;
    // entities are sometimes deleted but not removed from list results
    if (Array.isArray(output)) {
      output = output.filter(entity => entity);
    }
    return output;
  }, [entities, results, params && getFetchKey(params)]);
}
