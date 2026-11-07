import GlobalCache from './globalCache.native.js';
import WeakDependencyMap, { keep } from './WeakDependencyMap.native.js';
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
import type { IMemoPolicy } from './types.js';

// TODO: make MemoCache generic on the arguments sent to Delegate constructor

/** Singleton to store the memoization cache for denormalization methods
 *
 * React Native build: `MemoCache.ts` plus `commit()`, which keeps committed
 * results through the native memo's bounded retention. Keep the two in step.
 */
export default class MemoCache {
  /** Cache for every entity based on its dependencies and its own input */
  declare protected _getCache: GetEntityCache;
  /** Caches the final denormalized form based on input, entities */
  protected endpoints = new WeakDependencyMap<EntityPath>();
  /** Results read per store `entities`, until that store commits: each
   * result's node and entry, at most `MAX_PENDING` per store, newest last. */
  private reads = new WeakMap<object, Map<unknown, unknown>>();
  /** `entities` from the latest `commit`; reads with it are kept right away. */
  private committedEntities: object | undefined = undefined;
  /** Whether that store had no optimistic updates. */
  private committedSettled = true;
  /** One per `commit`, so `keep()` walks each entry once per commit. */
  private gen = 0;
  /** `buildQueryKey`'s node and entry pair for `track()`; emptied after each use */
  private queryRecords: unknown[] = [];
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

    const cache = new GlobalCache(
      getEntity,
      this._getCache,
      this.endpoints,
      args,
    );
    const result = getUnvisit(getEntity, cache, args)(schema, input);
    this.track(entities, cache.records);
    return result;
  }

  /** Pins `records` (node and entry pairs) if `entities` is committed, or
   * remembers them until it commits. */
  private track(entities: unknown, records: unknown[]): void {
    if (!records.length || typeof entities !== 'object' || entities === null)
      return;
    if (entities === this.committedEntities) {
      for (let i = 0; i < records.length; i += 2)
        keep(records[i], records[i + 1], this.committedSettled, this.gen);
      return;
    }
    let reads = this.reads.get(entities);
    if (!reads) this.reads.set(entities, (reads = new Map()));
    for (let i = 0; i < records.length; i += 2) {
      // one per node, the last read wins
      reads.delete(records[i]);
      reads.set(records[i], records[i + 1]);
      // a store that never commits must not keep results alive without bound
      if (reads.size > MAX_PENDING) reads.delete(reads.keys().next().value);
    }
  }

  /**
   * Marks `entities` as the committed store version.
   *
   * Every result already read with `entities` is kept through later one-off
   * reads (such as each retry of a pending transition, which builds new
   * entities), and so is every later read with the same `entities`.
   *
   * Call it once a render of that store has committed. `DataProvider` calls
   * it from an effect, which never runs for a discarded render. Without it,
   * results are kept by recency alone.
   *
   * Every nested value in a kept result is kept too, so a later read of one
   * of its entities gets the same object.
   *
   * @param entities The `entities` of the committed state, by reference.
   * @param settled Whether that state has no optimistic updates.
   */
  commit(entities: object, settled = true): void {
    // a re-render of the same store: its reads are already pinned this `gen`
    if (
      entities === this.committedEntities &&
      settled === this.committedSettled
    )
      return;
    this.committedEntities = entities;
    this.committedSettled = settled;
    this.gen++;
    const reads = this.reads.get(entities);
    if (!reads) return;
    this.reads.delete(entities);
    reads.forEach((entry, node) => keep(node, entry, settled, this.gen));
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
      WeakDependencyMap<QueryPath, object, any> | undefined;
    if (!queryCache) {
      queryCache = new WeakDependencyMap<QueryPath>();
      this.queryKeys.set(argsKey, queryCache);
    }

    const baseDelegate = new this.policy.QueryDelegate(state);
    // committed renders keep their query key too, or the result they pinned
    // is looked up with a new input
    const records = this.queryRecords;
    // eslint-disable-next-line prefer-const
    let [value, paths] = queryCache.get(
      schema as any,
      getDependency(baseDelegate),
      undefined,
      records,
    );

    // paths undefined is the only way to truly tell nothing was found (the value could have actually been undefined)
    if (!paths) {
      const [delegate, dependencies] = baseDelegate.tracked(schema);

      value = buildQueryKey(delegate)(schema, args);
      queryCache.set(dependencies, value, undefined, undefined, records);
    }
    this.track(state.entities, records);
    records.length = 0;
    return value;
  }
}

/** Results remembered per uncommitted store; past this, the oldest go. A
 * render reads one result per hook, so this is far above any one screen. */
const MAX_PENDING = 256;

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
