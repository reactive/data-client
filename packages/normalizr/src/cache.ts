import type { EntityInterface } from './interface.js';
import { Path } from './types.js';

export default interface Cache {
  get(
    pk: string,
    schema: EntityInterface,
    entity: any,
    computeValue: (localCacheKey: Record<string, any>) => [boolean, boolean],
  ): [denormalized: object | undefined, found: boolean, deleted: boolean];
  getResults(
    input: any,
    cachable: boolean,
    computeValue: () => [denormalized: any, found: boolean, deleted: boolean],
  ): [denormalized: any, found: boolean, deleted: boolean, entityPaths: Path[]];
}
