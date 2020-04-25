import NestingEntity from './NestingEntity';

/** Represents data with primary key being from 'id' field. */
export default class IDEntity extends NestingEntity {
  readonly id: string | number | undefined = undefined;

  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  pk(parent?: any, key?: string): string | undefined {
    return `${this.id}`;
  }
}
