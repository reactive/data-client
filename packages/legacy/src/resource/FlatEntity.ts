import { AbstractInstanceType, schema } from '@rest-hooks/normalizr';
import Entity from '@rest-hooks/legacy/resource/Entity';
import SimpleRecord from '@rest-hooks/legacy/resource/SimpleRecord';

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
