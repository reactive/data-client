import type Cache from './cache.js';
import type { EntityInterface, EntityPath } from '../interface.js';
import type { INVALID } from './symbol.js';
import type { KeyFn } from '../memo/WeakDependencyMap.js';

export default class LocalCache implements Cache {
  private localCache = new Map<string, Map<string, any>>();
  declare private _args: readonly any[];

  constructor(args: readonly any[] = []) {
    this._args = args;
  }

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
    const localCacheKey = this.localCache.get(key)!;

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

  /** Uncached path simply evaluates and discards — no dependency tracking. */
  argsKey(fn: KeyFn): string | undefined {
    return fn(this._args);
  }
}
