import { getEntities } from './getEntities.js';
import GlobalCache from './globalCache.js';
import getUnvisit from './unvisit.js';
import buildQueryKey, { validateQueryKey } from '../buildQueryKey.js';
import type { EntityTable, NormalizedIndex, Schema } from '../interface.js';
import { isImmutable } from '../schemas/ImmutableUtils.js';
import type {
  DenormalizeNullable,
  EntityCache,
  EntityPath,
  EndpointsCache,
  NormalizeNullable,
} from '../types.js';
import WeakDependencyMap from '../WeakDependencyMap.js';

//TODO: make immutable distinction occur when initilizing MemoCache

/** Singleton to store the memoization cache for denormalization methods */
export default class MemoCache {
  /** Cache for every entity based on its dependencies and its own input */
  protected entities: EntityCache = {};
  /** Caches the final denormalized form based on input, entities */
  protected endpoints: EndpointsCache = new WeakDependencyMap<EntityPath>();
  /** Caches the queryKey based on schema, args, and any used entities or indexes */
  protected queryKey: Map<
    Schema,
    {
      [key: string]: unknown;
    }
  > = new Map();

  /** Compute denormalized form maintaining referential equality for same inputs */
  denormalize<S extends Schema>(
    input: unknown,
    schema: S | undefined,
    entities: any,
    args: readonly any[] = [],
  ): {
    data: DenormalizeNullable<S> | symbol;
    paths: EntityPath[];
  } {
    // we already vary based on input, so we don't need endpointKey? TODO: verify
    // if (!this.endpoints[endpointKey])
    //   this.endpoints[endpointKey] = new WeakDependencyMap<EntityPath>();

    // undefined means don't do anything
    if (schema === undefined) {
      return { data: input as any, paths: [] };
    }
    if (input === undefined) {
      return { data: undefined as any, paths: [] };
    }
    const getEntity = getEntities(entities);

    return getUnvisit(
      getEntity,
      new GlobalCache(getEntity, this.entities, this.endpoints),
      args,
    )(input, schema);
  }

  /** Compute denormalized form maintaining referential equality for same inputs */
  query<S extends Schema>(
    argsKey: string,
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
  ): {
    data: DenormalizeNullable<S> | undefined;
    paths: EntityPath[];
    isInvalid: boolean;
  } {
    const input = this.buildQueryKey(argsKey, schema, args, entities, indexes);

    if (!validateQueryKey(input)) {
      return { data: input as any, paths: [], isInvalid: true };
    }

    const { data, paths } = this.denormalize(input, schema, entities, args);
    return { data, paths, isInvalid: false } as any;
  }

  buildQueryKey<S extends Schema>(
    argsKey: string,
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
  ): NormalizeNullable<S> {
    // MEMOIZE buildQueryKey - vary on schema + argsKey
    // NOTE: different orders can result in cache busting here; but since it's just a perf penalty we will allow for now
    if (!this.queryKey.has(schema)) {
      this.queryKey.set(schema, {});
    }
    const querySchemaCache = this.queryKey.get(schema) as {
      [key: string]: NormalizeNullable<S>;
    };
    if (!querySchemaCache[argsKey] || true) {
      // do equivalent of this:
      // cache.getEntity(pk, schema, entity, localCacheKey =>
      //   unvisitEntityObject(entity, schema, unvisit, pk, localCacheKey, args),
      // );
      // stores any object touched
      const touchList = [];
      const lookupEntity = createLookupEntity(entities);
      const lookupIndex = createLookupIndex(indexes);
      querySchemaCache[argsKey] = buildQueryKey(
        schema,
        args,
        lookupIndex,
        lookupEntity,
      );
    }
    return querySchemaCache[argsKey];
  }
}

export function createLookupEntity(
  entities:
    | EntityTable
    | {
        get(k: string): { toJS(): any } | undefined;
      },
  touchList: any[] = [],
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
