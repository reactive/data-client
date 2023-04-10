import type { EntityInterface } from '../interface.js';
import { Path } from '../types.js';

export default interface Cache {
  getEntity(
    pk: string,
    schema: EntityInterface,
    entity: any,
    computeValue: (localCacheKey: Record<string, any>) => void,
  ): object | undefined | symbol;
  getResults(
    input: any,
    cachable: boolean,
    computeValue: () => any,
  ): [denormalized: any, entityPaths: Path[]];
}
