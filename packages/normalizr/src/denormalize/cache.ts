import type { EntityInterface } from '../interface.js';
import { Path } from '../types.js';

export default interface Cache {
  getEntity(
    pk: string,
    schema: EntityInterface,
    entity: any,
    computeValue: (localCacheKey: Record<string, any>) => boolean,
  ): [denormalized: object | undefined, deleted: boolean];
  getResults(
    input: any,
    cachable: boolean,
    computeValue: () => [denormalized: any, deleted: boolean],
  ): [denormalized: any, deleted: boolean, entityPaths: Path[]];
}
