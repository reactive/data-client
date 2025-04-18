import type { EntityInterface, EntityPath } from '../interface.js';
import type { INVALID } from './symbol.js';

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
}
