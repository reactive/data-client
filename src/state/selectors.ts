import { createSelector } from 'reselect';
import { State } from '../types';
import { ReadShape, isEntity, SchemaOf } from '../resource/types';
import { Schema, denormalize } from '../resource/normal';

export function selectMeta<R = any>(state: State<R>, url: string) {
  return state.meta[url];
}

export const makeResults = <R = any>(getUrl: (...args: any[]) => string) => (
  state: State<R>,
  params: object
) => state.results[getUrl(params)] || null;

export function makeSchemaSelector<
Params extends Readonly<object>,
Body extends Readonly<object> | void,
S extends Schema
>(
  { schema, getUrl }: Pick<ReadShape<Params, Body, S>, 'schema' | 'getUrl'>,
  getResultList?: (results: any) => SchemaOf<typeof schema>
): (state: State<any>, params: Params) => SchemaOf<typeof schema> | null {
  const selectResults = makeResults<any>(getUrl);
  const ret = createSelector(
    (state: State<any>) => state.entities,
    selectResults,
    (state: State<any>, params: Params) => params,
    (entities, results, params: Params) => {
      // We can grab entities without actual results if the params compute a primary key
      if (isEntity(schema) && !results) {
        const id = schema.getId(params, undefined, '');
        // in case we don't even have entities for a model yet, denormalize() will throw
        if (
          id !== undefined &&
          id !== '' &&
          entities[schema.key] !== undefined
        ) {
          results = id;
        }
      }
      if (!entities || !results) return null;
      if (process.env.NODE_ENV !== 'production' && isEntity(schema)) {
        if (Array.isArray(results)) {
          throw new Error(
            `url ${getUrl(
              params
            )} has list results when single result is expected`
          );
        }
        if (typeof results === 'object') {
          throw new Error(
            `url ${getUrl(
              params
            )} has object results when single result is expected`
          );
        }
      }
      let output = denormalize(results, schema, entities);
      if (getResultList) {
        output = getResultList(output);
      }
      if (!output) return null;
      if (process.env.NODE_ENV !== 'production' && !Array.isArray(output)) {
        // this is the immutable.js look-alike hack
        if (!output.__ownerID) {
          throw new Error(`wrong type found : ${output}`);
        }
      }
      if (Array.isArray(output)) {
        output = output.filter(entity => entity);
      }
      return output;
    }
  );
  return ret;
}
