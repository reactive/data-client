import type Cache from './cache.js';
import type { EntityInterface } from '../interface.js';
import type { Path } from '../types.js';

export default class LocalCache implements Cache {
  private localCache: Record<string, Record<string, any>> = {};

  getEntity(
    pk: string,
    schema: EntityInterface,
    entity: any,
    computeValue: (localCacheKey: Record<string, any>) => boolean,
  ): [denormalized: object | undefined, deleted: boolean] {
    const key = schema.key;
    if (!(key in this.localCache)) {
      this.localCache[key] = Object.create(null);
    }
    const localCacheKey = this.localCache[key];

    let deleted = false;
    if (!localCacheKey[pk]) {
      deleted = computeValue(localCacheKey);
    }
    return [localCacheKey[pk], deleted];
  }

  getResults(
    input: any,
    cachable: boolean,
    computeValue: () => [denormalized: any, deleted: boolean],
  ): [denormalized: any, deleted: boolean, entityPaths: Path[]] {
    const ret = computeValue();
    // this is faster than spread
    // https://www.measurethat.net/Benchmarks/Show/23636/0/spread-with-tuples
    return [ret[0], ret[1], []];
  }
}
