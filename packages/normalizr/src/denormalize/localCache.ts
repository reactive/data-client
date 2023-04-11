import type Cache from './cache.js';
import type { EntityInterface } from '../interface.js';
import type { Path } from '../types.js';

export default class LocalCache implements Cache {
  private localCache: Record<string, Record<string, any>> = {};

  getEntity(
    pk: string,
    schema: EntityInterface,
    entity: any,
    computeValue: (localCacheKey: Record<string, any>) => void,
  ): object | undefined | symbol {
    const key = schema.key;
    if (!(key in this.localCache)) {
      this.localCache[key] = Object.create(null);
    }
    const localCacheKey = this.localCache[key];

    if (!localCacheKey[pk]) {
      computeValue(localCacheKey);
    }
    return localCacheKey[pk];
  }

  getResults(
    input: any,
    cachable: boolean,
    computeValue: () => any,
  ): {
    data: any;
    paths: Path[];
  } {
    return { data: computeValue(), paths: [] };
  }
}
