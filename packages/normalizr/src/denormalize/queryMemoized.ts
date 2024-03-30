import GlobalCache from './globalCache.js';
import { INVALID } from './symbol.js';
import getUnvisit from './unvisit.js';
import buildQueryKey, { validateQueryKey } from '../buildQueryKey.js';
import type { EntityTable, NormalizedIndex, Schema } from '../interface.js';
import { isImmutable } from '../schemas/ImmutableUtils.js';
import type {
  DenormalizeNullable,
  EntityCache,
  Path,
  EndpointsCache,
} from '../types.js';
import WeakEntityMap, { getEntities } from '../WeakEntityMap.js';

export function queryMemoized<S extends Schema>(
  schema: S,
  args: any[],
  entities:
    | Record<string, Record<string, object>>
    | {
        get(k: string): any;
        getIn(k: string[]): any;
      },
  indexes:
    | NormalizedIndex
    | {
        getIn(k: string[]): any;
      },
  entityCache: EntityCache = {},
  resultCache: EndpointsCache = new WeakEntityMap(),
  queriesCache: Map<
    Schema,
    {
      [key: string]: unknown;
    }
  > = new Map(),
): {
  data: DenormalizeNullable<S> | undefined;
  paths: Path[];
  isInvalid: boolean;
} {
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
    const lookupEntity = createLookupEntity(entities);
    const lookupIndex = createLookupIndex(indexes);
    // do equivalent of this:
    // cache.getEntity(pk, schema, entity, localCacheKey =>
    //   unvisitEntityObject(entity, schema, unvisit, pk, localCacheKey, args),
    // );
    querySchemaCache[key] = buildQueryKey(
      schema,
      args,
      lookupIndex,
      lookupEntity,
    );
  }
  const input = querySchemaCache[key];
  // END BLOCK

  // when not active simply return the query input without denormalizing
  if (args.length === 1 && args[0] === null) {
    return { data: input as any, paths: [], isInvalid: false };
  }

  if (input === undefined || !validateQueryKey(input)) {
    return { data: input as any, paths: [], isInvalid: true };
  }

  const getEntity = getEntities(entities);
  const { data, paths } = getUnvisit(
    getEntity,
    new GlobalCache(getEntity, entityCache, resultCache),
    args,
  )(input, schema);
  return { data, paths, isInvalid: false };
}

export function createLookupEntity(
  entities:
    | EntityTable
    | {
        get(k: string): { toJS(): any } | undefined;
      },
) {
  const entityIsImmutable = isImmutable(entities);
  if (entityIsImmutable) {
    return (entityKey: string) => entities.get(entityKey)?.toJS?.();
  } else {
    return (entityKey: string): { readonly [pk: string]: any } | undefined =>
      entities[entityKey];
  }
}

export function createLookupIndex(
  indexes:
    | NormalizedIndex
    | {
        getIn(k: string[]): any;
      },
) {
  const entityIsImmutable = isImmutable(indexes);
  if (entityIsImmutable) {
    return (
      entityKey: string,
      indexName: string,
      indexKey: string,
    ): string | undefined => indexes.getIn([entityKey, indexName, indexKey]);
  } else {
    return (
      entityKey: string,
      indexName: string,
      indexKey: string,
    ): string | undefined => {
      if (indexes[entityKey]) {
        return indexes[entityKey][indexName][indexKey];
      }
    };
  }
}
