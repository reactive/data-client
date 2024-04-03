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
import WeakDependencyMap, { Dep, GetDependency } from '../WeakDependencyMap.js';

//TODO: make immutable distinction occur when initilizing MemoCache

/** Singleton to store the memoization cache for denormalization methods */
export default class MemoCache {
  /** Cache for every entity based on its dependencies and its own input */
  protected entities: EntityCache = {};
  /** Caches the final denormalized form based on input, entities */
  protected endpoints: EndpointsCache = new WeakDependencyMap<EntityPath>();
  /** Caches the queryKey based on schema, args, and any used entities or indexes */
  protected queryKeys: Record<string, WeakDependencyMap<QueryPath>> = {};

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
    // This is redundant for buildQueryKey checks, but that was is used for recursion so we still need the checks there
    // null is object so we need double check
    if (
      (typeof schema !== 'object' &&
        typeof (schema as any).queryKey !== 'function') ||
      !schema
    )
      return schema as any;

    if (!this.queryKeys[argsKey]) {
      this.queryKeys[argsKey] = new WeakDependencyMap<QueryPath>();
    }
    // cache lookup: argsKey -> schema -> ...touched indexes or entities
    const queryCache = this.queryKeys[argsKey];
    const lookupEntity = createLookupEntity(entities);
    const lookupIndex = createLookupIndex(indexes);
    // eslint-disable-next-line prefer-const
    let [value, paths] = queryCache.get(
      schema as any,
      createDepLookup(lookupEntity, lookupIndex),
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
        trackLookup(lookupEntity, dependencies),
        trackLookup(lookupIndex, dependencies),
      );
      queryCache.set(dependencies, value);
    }
    return value;
  }
}

type IndexPath = [key: string, field: string];
type EntitySchemaPath = [key: string];
type QueryPath = IndexPath | EntitySchemaPath;

function createDepLookup(lookupEntity, lookupIndex): GetDependency<QueryPath> {
  return (args: QueryPath) => {
    return args.length === 1 ? lookupEntity(...args) : lookupIndex(...args);
  };
}

function trackLookup<D extends any[], FD extends D>(
  lookup: (...args: FD) => any,
  dependencies: Dep<D>[],
) {
  return ((...args: Parameters<typeof lookup>) => {
    const value = lookup(...args);
    dependencies.push({ path: args, entity: value });
    return value;
  }) as any;
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
      key: string,
      field: string,
    ): { readonly [indexKey: string]: string | undefined } =>
      indexes.getIn([key, field])?.toJS?.();
  } else {
    return (
      key: string,
      field: string,
    ): { readonly [indexKey: string]: string | undefined } => {
      if (indexes[key]) {
        return indexes[key][field];
      }
      return {};
    };
  }
}
