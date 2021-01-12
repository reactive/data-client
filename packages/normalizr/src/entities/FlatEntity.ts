import Entity from './Entity';
import * as schema from '../schema';
import { AbstractInstanceType } from '../types';
import { SimpleRecord } from '..';

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
