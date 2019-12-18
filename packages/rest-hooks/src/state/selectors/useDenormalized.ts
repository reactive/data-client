import { useMemo } from 'react';

import buildInferredResults from './buildInferredResults';

import { State } from '~/types';
import {
  isEntity,
  ReadShape,
  Schema,
  denormalize,
  DenormalizeNullable,
} from '~/resource';

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
  { schema, getFetchKey }: Pick<ReadShape<S, Params>, 'schema' | 'getFetchKey'>,
  params: Params | null,
  state: State<any>,
): [
  DenormalizeNullable<typeof schema>,
  typeof params extends null ? false : boolean,
] {
  // Select from state
  const entities = state.entities;
  const cacheResults = params && state.results[getFetchKey(params)];

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
    /* istanbul ignore next */
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
    const [denormalized, entitiesFound]: [any, boolean] = denormalize(
      results,
      schema,
      entities,
    );
    return [denormalized, entitiesFound] as any;
    // TODO: would be nice to make this only recompute on the entity types that are in schema
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, params && getFetchKey(params), results]);
}
