import GlobalCache from './globalCache.js';
import WeakDependencyMap from './WeakDependencyMap.js';
import buildQueryKey from '../buildQueryKey.js';
import {
  DelegateImmutable,
  TrackingQueryDelegateImmutable,
} from './Delegate.immutable.js';
import { getEntities } from '../denormalize/getEntities.js';
import getUnvisit from '../denormalize/unvisit.js';
import type { NormalizedIndex, Schema } from '../interface.js';
import { isImmutable } from '../schemas/ImmutableUtils.js';
import type {
  DenormalizeNullable,
  EntityPath,
  NormalizeNullable,
} from '../types.js';
import {
  getDependency,
  BaseDelegate,
  TrackingQueryDelegate,
} from './Delegate.js';
import { EndpointsCache, EntityCache } from './types.js';
import { QueryPath } from './types.js';

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
    state: StateInterface,
    // NOTE: different orders can result in cache busting here; but since it's just a perf penalty we will allow for now
    argsKey: string = JSON.stringify(args),
  ): DenormalizeNullable<S> | undefined {
    const input = this.buildQueryKey(schema, args, state, argsKey);

    if (!input) {
      return;
    }

    const { data } = this.denormalize(schema, input, state.entities, args);
    return typeof data === 'symbol' ? undefined : (data as any);
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
    if (!this.queryKeys.get(argsKey)) {
      this.queryKeys.set(argsKey, new WeakDependencyMap<QueryPath>());
    }
    const queryCache = this.queryKeys.get(argsKey) as WeakDependencyMap<
      QueryPath,
      object,
      any
    >;

    const imm = isImmutable(state.entities);

    // TODO: remove casting when we split this to immutable vs plain implementations
    const baseDelegate = new (imm ? DelegateImmutable : BaseDelegate)(
      state as any,
    );
    // eslint-disable-next-line prefer-const
    let [value, paths] = queryCache.get(
      schema as any,
      getDependency(baseDelegate),
    );

    // paths undefined is the only way to truly tell nothing was found (the value could have actually been undefined)
    if (!paths) {
      const tracked = new (
        imm ?
          TrackingQueryDelegateImmutable
        : TrackingQueryDelegate)(baseDelegate, schema);

      value = buildQueryKey(tracked)(schema, args);
      queryCache.set(tracked.dependencies, value);
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
