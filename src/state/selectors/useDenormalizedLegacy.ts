import { useMemo } from 'react';
import { State } from '~/types';
import { isEntity, ReadShape } from '~/resource/types';
import {
  Schema,
  denormalize,
  ResultType,
  Denormalized,
} from '~/resource/normal';
import buildInferredResultsLegacy from './buildInferredResultsLegacy';

/**
 * Selects the denormalized form from `state` cache.
 *
 * If `result` is not found, will attempt to generate it naturally
 * using params and schema. This increases cache hit rate for many
 * detail shapes.
 */
export default function useDenormalizedLegacy<
  Params extends Readonly<object>,
  S extends Schema
>(
  {
    schema,
    getFetchKey,
  }: Pick<ReadShape<S, Params, any>, 'schema' | 'getFetchKey'>,
  params: Params | null,
  state: State<any>,
): Denormalized<typeof schema> | null {
  // Select from state
  const entities = state.entities;
  const cacheResults =
    params && (state.results[getFetchKey(params)] as ResultType<typeof schema>);

  // We can grab entities without actual results if the params compute a primary key
  const results = useMemo(() => {
    if (!params) return null;
    if (cacheResults) return cacheResults;

    // in case we don't even have entities for a model yet, denormalize() will throw
    // entities[entitySchema.key] === undefined
    return buildInferredResultsLegacy(schema, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheResults, params && getFetchKey(params)]);

  // The final denormalize block
  return useMemo(() => {
    if (!entities || !params || !results) return null;

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
    let denormalized = denormalize(results, schema, entities);
    if (!denormalized) return null;
    // entities are sometimes deleted but not removed from list results
    if (Array.isArray(denormalized)) {
      denormalized = denormalized.filter((entity: any) => entity);
    }
    return denormalized;
    // TODO: would be nice to make this only recompute on the entity types that are in schema
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, params && getFetchKey(params), results]);
}
