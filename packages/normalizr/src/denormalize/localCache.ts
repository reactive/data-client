import type Cache from './cache.js';
import type { EntityInterface } from '../interface.js';
import type { EntityPath } from '../types.js';
import type { INVALID } from './symbol.js';

export default class LocalCache implements Cache {
  private localCache = new Map<string, Map<string, any>>();

  getEntity(
    pk: string,
    schema: EntityInterface,
    entity: any,
    computeValue: (localCacheKey: Map<string, any>) => void,
  ): object | undefined | typeof INVALID {
    const key = schema.key;
    if (!this.localCache.has(key)) {
      this.localCache.set(key, new Map<string, any>());
    }
    const localCacheKey = this.localCache.get(key) as Map<string, any>;

    if (!localCacheKey.get(pk)) {
      computeValue(localCacheKey);
    }
    return localCacheKey.get(pk);
  }

  getResults(
    input: any,
    cachable: boolean,
    computeValue: () => any,
  ): {
    data: any;
    paths: EntityPath[];
  } {
    return { data: computeValue(), paths: [] };
  }
}
