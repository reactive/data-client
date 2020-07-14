import { State } from '@rest-hooks/core/types';
import { DenormalizeNullable } from '@rest-hooks/core/endpoint';
import { isEntity, Schema, denormalize } from '@rest-hooks/normalizr';
import { useMemo } from 'react';
import {
  EndpointInterface,
  FetchFunction,
  EndpointParam,
} from '@rest-hooks/endpoint';

import buildInferredResults from './buildInferredResults';

/**
 * Selects the denormalized form from `state` cache.
 *
 * If `result` is not found, will attempt to generate it naturally
 * using params and schema. This increases cache hit rate for many
 * detail shapes.
 *
 * @returns [denormalizedValue, ready]
 */
export default function useDenormalized<
  E extends Omit<EndpointInterface, 'fetch'>
>(
  { schema, key, invalidIfStale }: E,
  params: EndpointParam<E> | null,
  state: State<any>,
): [
  DenormalizeNullable<E['schema']>,
  typeof params extends null ? false : boolean,
  boolean,
] {
  let entities = state.entities;
  const cacheResults = params && state.results[key(params)];
  const serializedParams = params && key(params);

  // We can grab entities without actual results if the params compute a primary key
  const results = useMemo(() => {
    if (cacheResults || !schema) return cacheResults;

    // in case we don't even have entities for a model yet, denormalize() will throw
    // entities[entitySchema.key] === undefined
    return buildInferredResults(schema, params ?? {}, state.indexes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheResults, state.indexes, serializedParams]);
  // TODO: only update when relevant indexes change

  const needsDenormalization = useMemo(
    () => schema && schemaHasEntity(schema),
    [schema],
  );

  // Compute denormalized value
  const [
    denormalized,
    entitiesFound,
    entitiesDeleted,
    entitiesList,
  ] = useMemo(() => {
    if (!needsDenormalization || !schema)
      return [cacheResults, cacheResults !== undefined, false, ''] as [
        DenormalizeNullable<typeof schema>,
        any,
        boolean,
        string,
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
    if (invalidIfStale && !cacheResults) entities = {};

    // second argument is false if any entities are missing
    // eslint-disable-next-line prefer-const
    let [denormalized, entitiesFound, entitiesDeleted, cache] = denormalize(
      results,
      schema,
      entities,
    );

    // this enables us to keep referential equality based on entities contained within
    const entitiesList = Object.values(cache)
      .map(Object.values)
      .reduce((a: any[], b: any[]) => a.concat(b), [])
      .join(',');

    return [denormalized, entitiesFound, entitiesDeleted, entitiesList] as [
      DenormalizeNullable<typeof schema>,
      boolean,
      boolean,
      string,
    ];
    // TODO: would be nice to make this only recompute on the entity types that are in schema
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    entities,
    serializedParams,
    results,
    cacheResults,
    needsDenormalization,
    invalidIfStale,
  ]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => [denormalized, entitiesFound, entitiesDeleted], [
    entitiesFound,
    entitiesDeleted,
    results,
    entitiesList,
  ]) as any;
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
