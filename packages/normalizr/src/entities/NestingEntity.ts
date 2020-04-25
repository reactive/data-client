import { isImmutable, denormalizeImmutable } from '../schemas/ImmutableUtils';
import Entity from './Entity';
import * as schema from '../schema';
import { AbstractInstanceType, NormalizedEntity } from '../types';

export default abstract class NestingEntity extends Entity {
  static denormalize<T extends typeof Entity>(
    this: T,
    entity: NormalizedEntity<T>,
    unvisit: schema.UnvisitFunction,
  ): [AbstractInstanceType<T>, boolean] {
    let denormEntity: AbstractInstanceType<T>;
    let found = true;
    if (isImmutable(entity)) {
      [denormEntity, found] = denormalizeImmutable(
        this.schema,
        entity,
        unvisit,
      );
      denormEntity = (denormEntity as any).toJS();
    } else {
      denormEntity = { ...entity } as any;

      Object.keys(this.schema).forEach(key => {
        const schema = this.schema[key];
        const [value, foundItem] = unvisit(entity[key], schema);
        if (!foundItem) {
          found = false;
        }
        if (Object.hasOwnProperty.call(entity, key)) {
          denormEntity[key] = value;
        }
      });
    }

    return [this.fromJS(denormEntity) as any, found];
  }
}
