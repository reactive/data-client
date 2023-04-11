import { Path } from './types.js';
import type { EntityInterface } from '../../../../interface.js';

export default interface Cache {
  getEntity(
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
it('[helper file in test folder]', () => {});
