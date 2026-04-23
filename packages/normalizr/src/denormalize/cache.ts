import type { EntityInterface, EntityPath } from '../interface.js';
import type { INVALID } from './symbol.js';
import type { KeyFn } from '../memo/WeakDependencyMap.js';

export default interface Cache {
  getEntity(
    pk: string,
    schema: EntityInterface,
    entity: any,
    computeValue: (localCacheKey: Map<string, any>) => void,
  ): object | undefined | typeof INVALID;
  getResults(
    input: any,
    cachable: boolean,
    computeValue: () => any,
  ): {
    data: any;
    paths: EntityPath[];
  };
  /** Records `fn(args)` as a memoization dimension for the surrounding
   * entity-cache frame and returns the value. */
  argsKey(fn: KeyFn): string | undefined;
}
