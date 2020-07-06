/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { SchemaClass, UnvisitFunction, EntityInterface } from '../schema';
import { DELETED } from '../special';
import type { AbstractInstanceType } from '..';

export default class Delete<E extends EntityInterface & { fromJS: any }>
  implements SchemaClass {
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

  denormalize(
    id: string,
    unvisit: UnvisitFunction,
  ): [AbstractInstanceType<E>, boolean, boolean] {
    return unvisit(id, this._entity) as any;
  }

  /* istanbul ignore next */
  _denormalizeNullable(): [
    AbstractInstanceType<E> | undefined,
    boolean,
    false,
  ] {
    return [] as any;
  }

  /* istanbul ignore next */
  _normalizeNullable(): string | undefined {
    return [] as any;
  }

  /* istanbul ignore next */
  merge(existing: any, incoming: any) {
    return incoming;
  }
}
