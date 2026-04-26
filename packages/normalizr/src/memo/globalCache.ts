import type { GetEntityCache } from './entitiesCache.js';
import { EndpointsCache } from './types.js';
import WeakDependencyMap, {
  type Dep,
  type KeyFn,
} from './WeakDependencyMap.js';
import type Cache from '../denormalize/cache.js';
import type { INVALID } from '../denormalize/symbol.js';
import type { EntityInterface, EntityPath } from '../interface.js';
import type { DenormGetEntity } from './types.js';

const PLACEHOLDER_DEP: Dep<EntityPath> = {
  path: { key: '', pk: '' },
  entity: undefined,
};

export default class GlobalCache implements Cache {
  private dependencies: Dep<EntityPath>[] = [PLACEHOLDER_DEP];
  private cycleCache: Map<string, Map<string, number>> = new Map();
  private cycleIndex = -1;
  private localCache: Map<string, Map<string, any>> = new Map();

  declare private _getCache: GetEntityCache;

  declare private _getEntity: DenormGetEntity;
  declare private _resultCache: EndpointsCache;
  declare private _args: readonly any[];
  /** Set true once `argsKey` is called for this denormalize frame. Gates
   * function-stripping fast paths in `paths()` / `getResults()`. */
  private _hasArgsKey = false;

  constructor(
    getEntity: DenormGetEntity,
    getCache: GetEntityCache,
    resultCache: EndpointsCache,
    args: readonly any[] = [],
  ) {
    this._getEntity = getEntity;
    this._getCache = getCache;
    this._resultCache = resultCache;
    this._args = args;
  }

  /** Records `fn(args)` as a string-keyed dependency for the surrounding
   * entity-cache frame and returns the value. The function reference is the
   * cache path key (must be referentially stable); `set` later re-evaluates
   * the function with the same `args` to derive the bucket key — keeps the
   * Dep shape monomorphic with entity-style deps (`{path, entity}`). */
  argsKey(fn: KeyFn): string | undefined {
    this._hasArgsKey = true;
    this.dependencies.push({ path: fn as any, entity: undefined });
    return fn(this._args);
  }

  getEntity(
    pk: string,
    schema: EntityInterface,
    entity: any,
    computeValue: (localCacheKey: Map<string, any>) => void,
  ): object | undefined | typeof INVALID {
    const key = schema.key;
    // cycleCache is deferred to the branch that actually needs it
    // to avoid unnecessary allocations.
    const localCacheKey = this.getOrCreateLocalCache(key);

    if (!localCacheKey.get(pk)) {
      const globalCache: WeakDependencyMap<
        EntityPath,
        object,
        EntityCacheValue
      > = this._getCache(pk, schema);
      const [cacheValue, cachePath] = globalCache.get(
        entity,
        this._getEntity,
        this._args,
      );
      // TODO: what if this just returned the deps - then we don't need to store them

      if (cachePath) {
        localCacheKey.set(pk, cacheValue.value);
        // TODO: can we store the cache values instead of tracking *all* their sources?
        // this is only used for setting endpoints cache correctly. if we got this far we will def need to set as we would have already tried getting it
        // Indexed loop avoids spread-into-push overhead for large dep arrays
        const cdeps = cacheValue.dependencies;
        for (let i = 0; i < cdeps.length; i++) {
          this.dependencies.push(cdeps[i]);
        }
        // Replayed deps may include function-typed (`argsKey`) paths from
        // a prior frame's computeValue (e.g. Scalar.denormalize). Since
        // computeValue didn't run here, `argsKey()` wasn't called and the
        // flag would otherwise stay false — causing `paths()`'s fast path
        // to leak function refs into the EntityPath subscription list.
        if (globalCache.hasStringDeps) this._hasArgsKey = true;
        return cacheValue.value;
      }
      // if we don't find in denormalize cache then do full denormalize
      else {
        const trackingIndex = this.dependencies.length;
        const cycleCacheKey = this.getOrCreateCycleCache(key);
        cycleCacheKey.set(pk, trackingIndex);
        this.dependencies.push({ path: { key, pk }, entity });

        /** NON-GLOBAL_CACHE CODE */
        computeValue(localCacheKey);
        /** /END NON-GLOBAL_CACHE CODE */

        cycleCacheKey.delete(pk);
        // if in cycle, use the start of the cycle to track all deps
        // otherwise, we use our own trackingIndex
        const localKey = this.dependencies.slice(
          this.cycleIndex === -1 ? trackingIndex : this.cycleIndex,
        );
        const cacheValue: EntityCacheValue = {
          dependencies: localKey,
          value: localCacheKey.get(pk),
        };
        globalCache.set(localKey, cacheValue, this._args);

        // start of cycle - reset cycle detection
        if (this.cycleIndex === trackingIndex) {
          this.cycleIndex = -1;
        }
      }
    } else {
      const cycleCacheKey = this.cycleCache.get(key);
      // cycle detected
      if (cycleCacheKey?.has(pk)) {
        this.cycleIndex = cycleCacheKey.get(pk)!;
      } else {
        // with no cycle, globalCacheEntry will have already been set
        this.dependencies.push({ path: { key, pk }, entity });
      }
    }
    return localCacheKey.get(pk);
  }

  private getOrCreateLocalCache(key: string): Map<string, any> {
    let localCacheKey = this.localCache.get(key);
    if (!localCacheKey) {
      localCacheKey = new Map();
      this.localCache.set(key, localCacheKey);
    }
    return localCacheKey;
  }

  private getOrCreateCycleCache(key: string): Map<string, number> {
    let cycleCacheKey = this.cycleCache.get(key);
    if (!cycleCacheKey) {
      cycleCacheKey = new Map();
      this.cycleCache.set(key, cycleCacheKey);
    }
    return cycleCacheKey;
  }

  /** Cache varies based on input (=== aka reference) */
  getResults(
    input: any,
    cachable: boolean,
    computeValue: () => any,
  ): {
    data: any;
    paths: EntityPath[];
  } {
    if (!cachable) {
      return { data: computeValue(), paths: this.paths() };
    }

    let [data, paths] = this._resultCache.get(
      input,
      this._getEntity,
      this._args,
    );

    if (paths === undefined) {
      data = computeValue();
      // we want to do this before we fill our 'input' entry
      paths = this.paths();
      // fill pre-allocated slot 0 with the input reference
      this.dependencies[0] = { path: { key: '', pk: '' }, entity: input };
      this._resultCache.set(this.dependencies, data, this._args);
    } else {
      paths.shift();
      // strip any function-typed (`argsKey`) paths — not subscribable entities.
      // Only possible when the result cache has ever stored such a dep.
      if (this._resultCache.hasStringDeps) {
        for (let i = 0; i < paths.length; i++) {
          if (typeof paths[i] === 'function') {
            paths = paths.filter(p => typeof p !== 'function') as EntityPath[];
            break;
          }
        }
      }
    }
    return { data, paths };
  }

  /** Materialize the EntityPath subscription list. Function-typed
   * (`argsKey`) deps are not subscribable entities and are filtered out. */
  protected paths() {
    const deps = this.dependencies;
    // Fast path: when no `argsKey` was recorded this frame, `deps[1..]` are
    // all entity paths — restore the pre-allocated indexed-write pattern.
    if (!this._hasArgsKey) {
      const paths = new Array(deps.length - 1) as EntityPath[];
      for (let i = 1; i < deps.length; i++) {
        paths[i - 1] = deps[i].path as EntityPath;
      }
      return paths;
    }
    const paths: EntityPath[] = [];
    for (let i = 1; i < deps.length; i++) {
      const p = deps[i].path;
      if (typeof p !== 'function') paths.push(p as EntityPath);
    }
    return paths;
  }
}

interface EntityCacheValue {
  dependencies: Dep<EntityPath>[];
  value: object | typeof INVALID | undefined;
}
