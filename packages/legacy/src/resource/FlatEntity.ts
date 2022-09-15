import { AbstractInstanceType, schema } from '@rest-hooks/endpoint';

import Entity from './Entity.js';
import SimpleRecord from './SimpleRecord.js';

/** @deprecated */
export default abstract class FlatEntity extends Entity {
  static denormalize<T extends typeof SimpleRecord>(
    this: T,
    entity: any,
    unvisit: schema.UnvisitFunction,
  ): [AbstractInstanceType<T>, boolean, boolean] {
    return [entity, true, false] as any;
  }
}
