import GlobalCache from './globalCache.js';
import { INVALID } from './symbol.js';
import getUnvisit from './unvisit.js';
import buildQueryKey from '../buildQueryKey.js';
import type {
  EntityTable,
  NormalizedIndex,
  Queryable,
  Schema,
} from '../interface.js';
import type {
  DenormalizeNullable,
  EntityCache,
  Path,
  EndpointsCache,
} from '../types.js';
import WeakEntityMap, { getEntities } from '../WeakEntityMap.js';

/**
 * TODO: make schema.queryKey indexes and entities accessible as functions that vary the cache based on access
 * then we only need to vary based on args and schema otherwise
 */
export function queryMemoized<S extends Schema>(
  schema: S,
  args: any[],
  entities: Record<string, Record<string, object>>,
  indexes: NormalizedIndex,
  entityCache: EntityCache = {},
  resultCache: EndpointsCache = new WeakEntityMap(),
  queriesCache: Map<
    Schema,
    {
      [key: string]: unknown;
    }
  >,
): DenormalizeNullable<S> | undefined {
  // MEMOIZE buildQueryKey - vary on schema + args
  // NOTE: different orders can result in cache busting here; but since it's just a perf penalty we will allow for now
  const key = JSON.stringify(args);
  if (!queriesCache.has(schema)) {
    queriesCache.set(schema, {});
  }
  const querySchemaCache = queriesCache.get(schema) as {
    [key: string]: unknown;
  };
  if (!querySchemaCache[key] || true) {
    const listEntities = createListEntities(entities);
    const lookupIndex = createLookupIndex(indexes);
    querySchemaCache[key] = buildQueryKey(
      schema,
      args,
      lookupIndex,
      listEntities,
    );
  }
  const input = querySchemaCache[key];
  // END BLOCK

  if (input === undefined) {
    return;
  }
  const getEntity = getEntities(entities);

  const data = getUnvisit(
    getEntity,
    new GlobalCache(getEntity, entityCache, resultCache),
    args,
  )(input, schema).data;
  return typeof data === 'symbol' ? undefined : (data as any);
}

const createListEntities =
  (entities: EntityTable) =>
  <T>(entityKey: string, mapEntity: (entity: any) => T): T[] | symbol => {
    const entitiesEntry = entities[entityKey];
    // we must wait until there are entries for any 'All' query to be Valid
    if (entitiesEntry === undefined) return INVALID;
    return Object.values(entitiesEntry).map(mapEntity);
  };

const createLookupIndex =
  (indexes: NormalizedIndex) =>
  (
    entityKey: string,
    indexName: string,
    indexKey: string,
  ): string | undefined => {
    if (indexes[entityKey]) {
      return indexes[entityKey][indexName][indexKey];
    }
  };
