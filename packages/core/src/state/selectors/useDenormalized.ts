import { State } from '@rest-hooks/core/types';
import { ReadShape, ParamsFromShape } from '@rest-hooks/core/endpoint';
import { DenormalizeNullable } from '@rest-hooks/endpoint';
import {
  isEntity,
  Schema,
  denormalize,
  DenormalizeCache,
  WeakListMap,
} from '@rest-hooks/normalizr';
import { useMemo } from 'react';

import buildInferredResults from './buildInferredResults';

/**
 * Selects the denormalized form from `state` cache.
 *
 * If `result` is not found, will attempt to generate it naturally
 * using params and schema. This increases cache hit rate for many
 * detail shapes.
 *
 *
 * @returns [denormalizedValue, ready]
 */
export default function useDenormalized<
  Shape extends Pick<ReadShape<any, any>, 'getFetchKey' | 'schema' | 'options'>
>(
  { schema, getFetchKey, options }: Shape,
  params: ParamsFromShape<Shape> | null,
  state: State<any>,
  denormalizeCache: DenormalizeCache = { entities: {}, results: {} },
): [
  DenormalizeNullable<Shape['schema']>,
  typeof params extends null ? false : boolean,
  boolean,
] {
  let entities = state.entities;
  const cacheResults = params && state.results[getFetchKey(params)];
  const serializedParams = params && getFetchKey(params);

  // We can grab entities without actual results if the params compute a primary key
  const results = useMemo(() => {
    if (cacheResults) return cacheResults;

    // in case we don't even have entities for a model yet, denormalize() will throw
    // entities[entitySchema.key] === undefined
    return buildInferredResults(schema, params, state.indexes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheResults, state.indexes, serializedParams]);
  // TODO: only update when relevant indexes change

  const needsDenormalization = useMemo(() => schemaHasEntity(schema), [schema]);

  // Compute denormalized value
  return useMemo(() => {
    if (!needsDenormalization)
      return [cacheResults, cacheResults !== undefined, false] as [
        DenormalizeNullable<Shape['schema']>,
        any,
        boolean,
      ];
    // Warn users with bad configurations
    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'production' && isEntity(schema)) {
      const paramEncoding = serializedParams || '';
      if (Array.isArray(results)) {
        throw new Error(
          `fetch key ${paramEncoding} has list results when single result is expected`,
        );
      }
      if (typeof results === 'object') {
        throw new Error(
          `fetch key ${paramEncoding} has object results when single result is expected`,
        );
      }
    }

    // inferred results are considered stale
    if (options && options.invalidIfStale && !cacheResults) entities = {};

    if (params && !denormalizeCache.results[getFetchKey(params)])
      denormalizeCache.results[getFetchKey(params)] = new WeakListMap();

    // second argument is false if any entities are missing
    // eslint-disable-next-line prefer-const
    return denormalize(
      results,
      schema,
      entities,
      denormalizeCache.entities,
      params ? denormalizeCache.results[getFetchKey(params)] : undefined,
    ) as [DenormalizeNullable<Shape['schema']>, boolean, boolean];

    // TODO: would be nice to make this only recompute on the entity types that are in schema
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    entities,
    serializedParams,
    results,
    cacheResults,
    needsDenormalization,
    options && options.invalidIfStale,
  ]);
}

/** Determine whether the schema has any entities.
 *
 * Without entities, denormalization is not needed, and results should not be inferred.
 */
function schemaHasEntity(schema: Schema): boolean {
  if (isEntity(schema)) return true;
  if (Array.isArray(schema))
    return schema.length !== 0 && schemaHasEntity(schema[0]);
  if (schema && (typeof schema === 'object' || typeof schema === 'function')) {
    const nestedSchema =
      'schema' in schema ? (schema.schema as Record<string, Schema>) : schema;
    return Object.values(nestedSchema).reduce(
      (prev, cur) => prev || schemaHasEntity(cur),
      false,
    );
  }
  return false;
}
