// we just removed instances of 'abstract new'
import type { UnvisitFunction } from '../interface.js';
import { AbstractInstanceType } from '../normal.js';
declare const Entity_base: import('./EntitySchema.js').IEntityClass<
  new (...args: any[]) => {
    pk(
      parent?: any,
      key?: string | undefined,
      args?: readonly any[] | undefined,
    ): string | undefined;
  }
> &
  (new (...args: any[]) => {
    pk(
      parent?: any,
      key?: string | undefined,
      args?: readonly any[] | undefined,
    ): string | undefined;
  });
/**
 * Represents data that should be deduped by specifying a primary key.
 * @see https://resthooks.io/docs/api/Entity
 */
export default abstract class Entity extends Entity_base {
  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  abstract pk(
    parent?: any,
    key?: string,
    args?: readonly any[],
  ): string | undefined;

  /** Control how automatic schema validation is handled
   *
   * `undefined`: Defaults - throw error in worst offense
   * 'warn': only ever warn
   * 'silent': Don't bother with processing at all
   *
   * Note: this only applies to non-nested members.
   */
  protected static automaticValidation?: 'warn' | 'silent';
  /** Return true to merge incoming data; false keeps existing entity
   *
   * @see https://resthooks.io/docs/api/schema.Entity#useIncoming
   */
  static useIncoming(
    existingMeta: {
      date: number;
      fetchedAt: number;
    },
    incomingMeta: {
      date: number;
      fetchedAt: number;
    },
    existing: any,
    incoming: any,
  ): boolean;

  /** Run when an existing entity is found in the store */
  static mergeWithStore(
    existingMeta:
      | {
          date: number;
          fetchedAt: number;
        }
      | undefined,
    incomingMeta: {
      date: number;
      fetchedAt: number;
    },
    existing: any,
    incoming: any,
  ): any;

  static mergeMetaWithStore(
    existingMeta: {
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    incomingMeta: {
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    existing: any,
    incoming: any,
  ): {
    expiresAt: number;
    date: number;
    fetchedAt: number;
  };

  /** Factory method to convert from Plain JS Objects.
   *
   * @param [props] Plain Object of properties to assign.
   */
  static fromJS: <T extends typeof Entity>(
    this: T,
    props?: Partial<AbstractInstanceType<T>>,
  ) => AbstractInstanceType<T>;

  /**
   * A unique identifier for each Entity
   *
   * @param [value] POJO of the entity or subset used
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  static pk: <T extends typeof Entity>(
    this: T,
    value: Partial<AbstractInstanceType<T>>,
    parent?: any,
    key?: string,
    args?: any[],
  ) => string | undefined;

  /** Do any transformations when first receiving input */
  static process(input: any, parent: any, key: string | undefined): any;
  static validate(processedEntity: any): string | undefined;
  static denormalize<T extends typeof Entity>(
    this: T,
    input: any,
    unvisit: UnvisitFunction,
  ): [denormalized: AbstractInstanceType<T>, found: boolean, suspend: boolean];

  /** Used by denormalize to set nested members */
  protected static set?(entity: any, key: string, value: any): void;
}
export {};
