import GlobalCache from './globalCache.js';
import WeakDependencyMap from './WeakDependencyMap.js';
import buildQueryKey from '../buildQueryKey.js';
import { GetEntityCache, getEntityCaches } from './entitiesCache.js';
import { MemoPolicy } from './Policy.js';
import { getDependency } from '../delegate/BaseDelegate.js';
import type { INVALID } from '../denormalize/symbol.js';
import getUnvisit from '../denormalize/unvisit.js';
import type {
  EntityPath,
  NormalizedIndex,
  QueryPath,
  Schema,
} from '../interface.js';
import type { DenormalizeNullable, NormalizeNullable } from '../types.js';
import type { IMemoPolicy, EndpointsCache } from './types.js';

// TODO: make MemoCache generic on the arguments sent to Delegate constructor

/** Singleton to store the memoization cache for denormalization methods */
export default class MemoCache {
  /** Cache for every entity based on its dependencies and its own input */
  declare protected _getCache: GetEntityCache;
  /** Caches the final denormalized form based on input, entities */
  protected endpoints: EndpointsCache = new WeakDependencyMap<EntityPath>();
  /** Caches the queryKey based on schema, args, and any used entities or indexes */
  protected queryKeys: Map<string, WeakDependencyMap<QueryPath>> = new Map();

  declare protected policy: IMemoPolicy;

  constructor(policy: IMemoPolicy = MemoPolicy) {
    this.policy = policy;
    this._getCache = getEntityCaches(new Map());
  }

  /** Compute denormalized form maintaining referential equality for same inputs */
  denormalize<S extends Schema>(
    schema: S | undefined,
    input: unknown,
    entities: any,
    args: readonly any[] = [],
  ): {
    data: DenormalizeNullable<S> | typeof INVALID;
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
    const getEntity = this.policy.getEntities(entities);

    return getUnvisit(
      getEntity,
      new GlobalCache(getEntity, this._getCache, this.endpoints),
      args,
    )(schema, input);
  }

  /** Compute denormalized form maintaining referential equality for same inputs */
  query<S extends Schema>(
    schema: S,
    args: readonly any[],
    state: StateInterface,
    // NOTE: different orders can result in cache busting here; but since it's just a perf penalty we will allow for now
    argsKey: string = JSON.stringify(args),
  ): {
    data: DenormalizeNullable<S> | typeof INVALID;
    paths: EntityPath[];
  } {
    const input = this.buildQueryKey(schema, args, state, argsKey);

    if (!input) {
      return { data: undefined as any, paths: [] };
    }

    return this.denormalize(schema, input, state.entities, args);
  }

  buildQueryKey<S extends Schema>(
    schema: S,
    args: readonly any[],
    state: StateInterface,
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
    let queryCache = this.queryKeys.get(argsKey) as
      | WeakDependencyMap<QueryPath, object, any>
      | undefined;
    if (!queryCache) {
      queryCache = new WeakDependencyMap<QueryPath>();
      this.queryKeys.set(argsKey, queryCache);
    }

    const baseDelegate = new this.policy.QueryDelegate(state);
    // eslint-disable-next-line prefer-const
    let [value, paths] = queryCache.get(
      schema as any,
      getDependency(baseDelegate),
    );

    // paths undefined is the only way to truly tell nothing was found (the value could have actually been undefined)
    if (!paths) {
      const [delegate, dependencies] = baseDelegate.tracked(schema);

      value = buildQueryKey(delegate)(schema, args);
      queryCache.set(dependencies, value);
    }
    return value;
  }
}

type StateInterface = {
  entities:
    | Record<string, Record<string, any> | undefined>
    | {
        getIn(k: string[]): any;
      };
  indexes:
    | NormalizedIndex
    | {
        getIn(k: string[]): any;
      };
};
