/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Invalidate from './Invalidate.js';
import type { EntityInterface } from '../interface.js';
import type { AbstractInstanceType } from '../normal.js';
import { SchemaClass, UnvisitFunction } from '../schema.js';

// TODO(breaking): mark deprecated
/**
 * Marks entity as deleted.
 * @see https://resthooks.io/rest/api/Delete
 */
export default class Delete<E extends EntityInterface & { process: any }>
  extends Invalidate<E>
  implements SchemaClass
{
  denormalize(
    id: string,
    unvisit: UnvisitFunction,
  ): [denormalized: AbstractInstanceType<E>, found: boolean, suspend: boolean] {
    return unvisit(id, this._entity) as any;
  }
}
