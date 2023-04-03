import type Cache from './cache.js';
import type { EntityInterface } from '../interface.js';
import type { Path } from '../types.js';

export default class LocalCache implements Cache {
  private localCache: Record<string, Record<string, any>> = {};

  getEntity(
    pk: string,
    schema: EntityInterface,
    entity: any,
    computeValue: (localCacheKey: Record<string, any>) => [boolean, boolean],
  ): [denormalized: object | undefined, found: boolean, deleted: boolean] {
    const key = schema.key;
    if (!(key in this.localCache)) {
      this.localCache[key] = Object.create(null);
    }
    const localCacheKey = this.localCache[key];

    let found = true;
    let deleted = false;
    if (!localCacheKey[pk]) {
      [found, deleted] = computeValue(localCacheKey);
    }
    return [localCacheKey[pk], found, deleted];
  }

  getResults(
    input: any,
    cachable: boolean,
    computeValue: () => [denormalized: any, found: boolean, deleted: boolean],
  ): [
    denormalized: any,
    found: boolean,
    deleted: boolean,
    entityPaths: Path[],
  ] {
    const ret = computeValue();
    // this is faster than spread
    // https://www.measurethat.net/Benchmarks/Show/23636/0/spread-with-tuples
    return [ret[0], ret[1], ret[2], []];
  }
}
