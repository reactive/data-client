import { useMemo } from 'react';
import { State } from '~/types';
import { isEntity, ReadShape } from '~/resource/types';
import {
  Schema,
  denormalize,
  ResultType,
  DenormalizedNullable,
} from '~/resource/normal';
import buildInferredResults from './buildInferredResults';

/**
 * Selects the denormalized form from `state` cache.
 *
 * If `result` is not found, will attempt to generate it naturally
 * using params and schema. This increases cache hit rate for many
 * detail shapes.
 *
 * @returns [denormalizedValue, allEntitiesFound]
 */
export default function useDenormalized<
  Params extends Readonly<object>,
  S extends Schema
>(
  {
    schema,
    getFetchKey,
  }: Pick<ReadShape<S, Params, any>, 'schema' | 'getFetchKey'>,
  params: Params | null,
  state: State<any>,
): [
  DenormalizedNullable<typeof schema>,
  typeof params extends null ? false : boolean,
] {
  // Select from state
  const entities = state.entities;
  const cacheResults =
    params && (state.results[getFetchKey(params)] as ResultType<typeof schema>);

  // We can grab entities without actual results if the params compute a primary key
  const results = useMemo(() => {
    if (cacheResults) return cacheResults;

    // in case we don't even have entities for a model yet, denormalize() will throw
    // entities[entitySchema.key] === undefined
    return buildInferredResults(schema, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheResults, params && getFetchKey(params)]);

  // The final denormalize block
  return useMemo(() => {
    // Warn users with bad configurations
    if (process.env.NODE_ENV !== 'production' && isEntity(schema)) {
      const paramEncoding = params ? getFetchKey(params) : '';
      if (Array.isArray(results)) {
        throw new Error(
          `url ${paramEncoding} has list results when single result is expected`,
        );
      }
      if (typeof results === 'object') {
        throw new Error(
          `url ${paramEncoding} has object results when single result is expected`,
        );
      }
    }

    // second argument is false if any entities are missing
    const [denormalized, entitiesFound] = denormalize(
      results,
      schema,
      entities,
    );
    // only consider missing entities a failure if results was inferred
    // delete will sometimes remove entities
    return [denormalized, !!cacheResults || entitiesFound] as any;
    // TODO: would be nice to make this only recompute on the entity types that are in schema
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, params && getFetchKey(params), results]);
}
