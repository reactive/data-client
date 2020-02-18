import { State } from 'rest-hooks/types';
import {
  isEntity,
  ReadShape,
  denormalize,
  DenormalizeNullable,
  ParamsFromShape,
} from 'rest-hooks/resource';

import { useMemo } from 'react';

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
  Shape extends Pick<ReadShape<any, any>, 'getFetchKey' | 'schema'>
>(
  { schema, getFetchKey }: Shape,
  params: ParamsFromShape<Shape> | null,
  state: State<any>,
): [
  DenormalizeNullable<Shape['schema']>,
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
    return buildInferredResults(schema, params, state.indexes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheResults, params && getFetchKey(params)]);

  // Compute denormalized value
  const [denormalized, entitiesFound, entitiesList] = useMemo(() => {
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
    const [denormalized, entitiesFound, cache] = denormalize(
      results,
      schema,
      entities,
    );

    // this enables us to keep referential equality based on entities contained within
    const entitiesList = Object.values(cache)
      .map(Object.values)
      .reduce((a: any[], b: any[]) => a.concat(b), [])
      .join(',');

    return [denormalized, entitiesFound, entitiesList] as [
      DenormalizeNullable<Shape['schema']>,
      any,
      string,
    ];
    // TODO: would be nice to make this only recompute on the entity types that are in schema
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, params && getFetchKey(params), results]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => [denormalized, entitiesFound], [
    entitiesFound,
    results,
    entitiesList,
  ]);
}
