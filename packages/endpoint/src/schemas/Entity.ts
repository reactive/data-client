/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { AbstractInstanceType } from '../normal.js';
import { Entity as EntitySchema } from '../schema.js';

const EmptyBase = class {} as any as abstract new (...args: any[]) => {
  pk(parent?: any, key?: string, args?: readonly any[]): string | undefined;
};

/**
 * Represents data that should be deduped by specifying a primary key.
 * @see https://dataclient.io/docs/api/Entity
 */
export default abstract class Entity extends EntitySchema(EmptyBase) {
  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   * @param [args] ...args sent to Endpoint
   * @see https://dataclient.io/rest/api/Entity#pk
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
  protected declare static automaticValidation?: 'warn' | 'silent';

  /** Factory method to convert from Plain JS Objects.
   *
   * @param [props] Plain Object of properties to assign.
   * @see https://dataclient.io/rest/api/Entity#fromJS
   */
  declare static fromJS: <T extends typeof Entity>(
    this: T,
    // TODO: this should only accept members that are not functions
    props?: Partial<AbstractInstanceType<T>>,
  ) => AbstractInstanceType<T>;

  /**
   * A unique identifier for each Entity
   *
   * @param [value] POJO of the entity or subset used
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   * @param [args] ...args sent to Endpoint
   */
  declare static pk: <T extends typeof Entity>(
    this: T,
    value: Partial<AbstractInstanceType<T>>,
    parent?: any,
    key?: string,
    args?: any[],
  ) => string | undefined;

  /** Do any transformations when first receiving input
   *
   * @see https://dataclient.io/docs/api/Entity#process
   */
  static process(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
  ): any {
    /* istanbul ignore else */
    if (
      process.env.NODE_ENV !== 'production' &&
      this.automaticValidation !== 'silent'
    ) {
      if (Array.isArray(input)) {
        const errorMessage = `Attempted to initialize ${
          this.name
        } with an array, but named members were expected

This is likely due to a malformed response.
Try inspecting the network response or fetch() return value.
Or use debugging tools: https://dataclient.io/docs/guides/debugging
Learn more about schemas: https://dataclient.io/docs/api/schema
If this is a mistake, you can disable this check by setting static automaticValidation = 'silent'

First three members: ${JSON.stringify(input.slice(0, 3), null, 2)}`;
        if (this.automaticValidation !== 'warn') {
          const error = new Error(errorMessage);
          (error as any).status = 400;
          throw error;
        }
        console.warn(errorMessage);
      }
    }

    return super.process(input, parent, key, args);
  }

  declare static denormalize: <T extends typeof Entity>(
    this: T,
    input: any,
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ) => AbstractInstanceType<T>;
}

if (process.env.NODE_ENV !== 'production') {
  /* istanbul ignore else */
  const superFrom = Entity.fromJS;
  // for those not using TypeScript this is a good catch to ensure they are defining
  // the abstract members
  Entity.fromJS = function fromJS<T extends typeof Entity>(
    this: T,
    props?: Partial<AbstractInstanceType<T>>,
  ): AbstractInstanceType<T> {
    if ((this as any).prototype.pk === Entity.prototype.pk)
      throw new Error('cannot construct on abstract types');
    return superFrom.call(this, props) as any;
  };
}
