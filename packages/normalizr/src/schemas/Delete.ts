/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { SchemaSimple, UnvisitFunction, EntityInterface } from '../schema';
import { DELETED } from '../special';
import type { AbstractInstanceType } from '..';

export default class Delete<E extends EntityInterface & { fromJS: any }>
  implements SchemaSimple {
  private declare _entity: E;

  constructor(entity: E) {
    if (process.env.NODE_ENV !== 'production' && !entity) {
      throw new Error('Expected option "entity" not found on DeleteSchema.');
    }
    this._entity = entity;
  }

  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
  ): string | undefined {
    // pass over already processed entities
    if (typeof input === 'string') return input;
    // TODO: what's store needs to be a differing type from fromJS
    const processedEntity = this._entity.fromJS(input, parent, key);
    const id = processedEntity.pk(parent, key);
    addEntity(this._entity, DELETED, processedEntity, parent, key);
    return id;
  }

  denormalize(entity: AbstractInstanceType<E>, unvisit: UnvisitFunction) {
    return this._entity.denormalize(entity, unvisit);
  }

  merge(existing: any, incoming: any) {
    return incoming;
  }
}
