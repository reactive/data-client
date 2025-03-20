import GlobalCache from './globalCache.js';
import { EndpointsCache, EntityCache } from './types.js';
import WeakDependencyMap, { Dep, GetDependency } from './WeakDependencyMap.js';
import buildQueryKey from '../buildQueryKey.js';
import { getEntities } from '../denormalize/getEntities.js';
import getUnvisit from '../denormalize/unvisit.js';
import type { EntityTable, NormalizedIndex, Schema } from '../interface.js';
import { isImmutable } from '../schemas/ImmutableUtils.js';
import type {
  DenormalizeNullable,
  EntityPath,
  NormalizeNullable,
} from '../types.js';

//TODO: make immutable distinction occur when initilizing MemoCache

/** Singleton to store the memoization cache for denormalization methods */
export default class MemoCache {
  /** Cache for every entity based on its dependencies and its own input */
  protected entities: EntityCache = new Map();
  /** Caches the final denormalized form based on input, entities */
  protected endpoints: EndpointsCache = new WeakDependencyMap<EntityPath>();
  /** Caches the queryKey based on schema, args, and any used entities or indexes */
  protected queryKeys: Map<string, WeakDependencyMap<QueryPath>> = new Map();

  /** Compute denormalized form maintaining referential equality for same inputs */
  denormalize<S extends Schema>(
    schema: S | undefined,
    input: unknown,
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
      isImmutable(entities),
    )(schema, input);
  }

  /** Compute denormalized form maintaining referential equality for same inputs */
  query<S extends Schema>(
    schema: S,
    args: readonly any[],
    entities:
      | Record<string, Record<string, any> | undefined>
      | {
          getIn(k: string[]): any;
        },
    indexes:
      | NormalizedIndex
      | {
          getIn(k: string[]): any;
        },
    // NOTE: different orders can result in cache busting here; but since it's just a perf penalty we will allow for now
    argsKey: string = JSON.stringify(args),
  ): DenormalizeNullable<S> | undefined {
    const input = this.buildQueryKey(schema, args, entities, indexes, argsKey);

    if (!input) {
      return;
    }

    const { data } = this.denormalize(schema, input, entities, args);
    return typeof data === 'symbol' ? undefined : (data as any);
  }

  buildQueryKey<S extends Schema>(
    schema: S,
    args: readonly any[],
    entities:
      | Record<string, Record<string, any> | undefined>
      | {
          getIn(k: string[]): any;
        },
    indexes:
      | NormalizedIndex
      | {
          getIn(k: string[]): any;
        },
    // NOTE: different orders can result in cache busting here; but since it's just a perf penalty we will allow for now
    argsKey: string = JSON.stringify(args),
  ): NormalizeNullable<S> {
    // This is redundant for buildQueryKey checks, but that was is used for recursion so we still need the checks there
    // TODO: If we make each recursive call include cache lookups, we combine these checks together
    // null is object so we need double check
    if (
      (typeof schema !== 'object' &&
        typeof (schema as any).queryKey !== 'function') ||
      !schema
    )
      return schema as any;

    // cache lookup: argsKey -> schema -> ...touched indexes or entities
    if (!this.queryKeys.get(argsKey)) {
      this.queryKeys.set(argsKey, new WeakDependencyMap<QueryPath>());
    }
    const queryCache = this.queryKeys.get(argsKey) as WeakDependencyMap<
      QueryPath,
      object,
      any
    >;
    const getEntity = createGetEntity(entities);
    const getIndex = createGetIndex(indexes);
    // eslint-disable-next-line prefer-const
    let [value, paths] = queryCache.get(
      schema as any,
      createDepLookup(getEntity, getIndex),
    );

    // paths undefined is the only way to truly tell nothing was found (the value could have actually been undefined)
    if (!paths) {
      // first dep path is ignored
      // we start with schema object, then lookup any 'touched' members and their paths
      const dependencies: Dep<QueryPath>[] = [
        { path: [''], entity: schema as any },
      ];

      value = buildQueryKey(
        schema,
        args,
        trackLookup(getEntity, dependencies),
        trackLookup(getIndex, dependencies),
      );
      queryCache.set(dependencies, value);
    }
    return value;
  }
}

type IndexPath = [key: string, field: string, value: string];
type EntitySchemaPath = [key: string] | [key: string, pk: string];
type QueryPath = IndexPath | EntitySchemaPath;

function createDepLookup(getEntity, getIndex): GetDependency<QueryPath> {
  return (args: QueryPath) => {
    return args.length === 3 ? getIndex(...args) : getEntity(...args);
  };
}

function trackLookup<D extends any[], FD extends D>(
  lookup: (...args: FD) => any,
  dependencies: Dep<D>[],
) {
  return ((...args: Parameters<typeof lookup>) => {
    const entity = lookup(...args);
    dependencies.push({ path: args, entity });
    return entity;
  }) as any;
}

export function createGetEntity(
  entities:
    | EntityTable
    | {
        getIn(k: string[]): { toJS(): any } | undefined;
      },
) {
  const entityIsImmutable = isImmutable(entities);
  if (entityIsImmutable) {
    return (...args) => entities.getIn(args)?.toJS?.();
  } else {
    return (entityKey: string | symbol, pk?: string): any =>
      pk ? entities[entityKey]?.[pk] : entities[entityKey];
  }
}

export function createGetIndex(
  indexes:
    | NormalizedIndex
    | {
        getIn(k: string[]): any;
      },
) {
  const entityIsImmutable = isImmutable(indexes);
  if (entityIsImmutable) {
    return (
      key: string,
      field: string,
      value: string,
    ): { readonly [indexKey: string]: string | undefined } =>
      indexes.getIn([key, field])?.toJS?.();
  } else {
    return (
      key: string,
      field: string,
      value: string,
    ): { readonly [indexKey: string]: string | undefined } => {
      if (indexes[key]) {
        return indexes[key][field];
      }
      return {};
    };
  }
}
