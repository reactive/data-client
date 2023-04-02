import type { Schema, EntityInterface, UnvisitFunction } from './interface.js';
import { DenormalizeCache } from './types.js';
import WeakEntityMap, {
  type Dep,
  getEntities,
  type GetEntity,
  depToPaths,
} from './WeakEntityMap.js';

export default class GlobalCache {
  dependencies: Dep[] = [];
  cycleCache: Record<string, Record<string, number>> = {};
  cycleIndex = -1;
  localCache: Record<string, Record<string, any>> = {};

  declare getCache: (
    pk: string,
    schema: EntityInterface,
  ) => WeakEntityMap<object, any>;

  declare getEntity: GetEntity;

  constructor(getEntity, getCache) {
    this.getEntity = getEntity;
    this.getCache = getCache;
  }

  get(
    pk: string,
    schema: EntityInterface,
    entity: any,
    computeValue: (localCacheKey: Record<string, any>) => [boolean, boolean],
  ): [denormalized: object | undefined, found: boolean, deleted: boolean] {
    const key = schema.key;
    if (!(key in this.localCache)) {
      this.localCache[key] = Object.create(null);
    }
    if (!(key in this.cycleCache)) {
      this.cycleCache[key] = Object.create(null);
    }
    const localCacheKey = this.localCache[key];
    const cycleCacheKey = this.cycleCache[key];

    let found = true;
    let deleted = false;
    if (!localCacheKey[pk]) {
      const globalCache: WeakEntityMap<object, EntityCacheValue> =
        this.getCache(pk, schema);
      const [cacheValue] = globalCache.get(entity, this.getEntity);
      // TODO: what if this just returned the deps - then we don't need to store them

      if (cacheValue) {
        localCacheKey[pk] = cacheValue.value[0];
        // TODO: can we store the cache values instead of tracking *all* their sources?
        // this is only used for setting results cache correctly. if we got this far we will def need to set as we would have already tried getting it
        this.dependencies.push(...cacheValue.dependencies);
        return cacheValue.value;
      }
      // if we don't find in denormalize cache then do full denormalize
      else {
        const trackingIndex = this.dependencies.length;
        cycleCacheKey[pk] = trackingIndex;
        this.dependencies.push({ entity, path: { key, pk } });

        /** NON-GLOBAL_CACHE CODE */
        [found, deleted] = computeValue(localCacheKey);
        /** /END NON-GLOBAL_CACHE CODE */

        delete cycleCacheKey[pk];
        // if in cycle, use the start of the cycle to track all deps
        // otherwise, we use our own trackingIndex
        const localKey = this.dependencies.slice(
          this.cycleIndex === -1 ? trackingIndex : this.cycleIndex,
        );
        const cacheValue: EntityCacheValue = {
          dependencies: localKey,
          value: [localCacheKey[pk], found, deleted],
        };
        globalCache.set(localKey, cacheValue);

        // start of cycle - reset cycle detection
        if (this.cycleIndex === trackingIndex) {
          this.cycleIndex = -1;
        }
      }
    } else {
      // cycle detected
      if (pk in cycleCacheKey) {
        this.cycleIndex = cycleCacheKey[pk];
      } else {
        // with no cycle, globalCacheEntry will have already been set
        this.dependencies.push({ entity, path: { key, pk } });
      }
    }
    return [localCacheKey[pk], found, deleted];
  }

  paths() {
    return depToPaths(this.dependencies);
  }
}

interface EntityCacheValue {
  dependencies: Dep[];
  value: [any, boolean, boolean];
}
