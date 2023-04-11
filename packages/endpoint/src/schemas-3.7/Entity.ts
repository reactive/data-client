/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { isImmutable, denormalizeImmutable } from './ImmutableUtils.js';
import type { UnvisitFunction } from './interface.js';
import { Entity as EntitySchema } from './schema.js';
import { AbstractInstanceType } from '../normal.js';

const EmptyBase = class {} as any as abstract new (...args: any[]) => {
  pk(parent?: any, key?: string): string | undefined;
};

/**
 * Represents data that should be deduped by specifying a primary key.
 * @see https://resthooks.io/docs/api/Entity
 */
export default abstract class Entity extends EntitySchema(EmptyBase) {
  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  abstract pk(parent?: any, key?: string): string | undefined;

  /** Control how automatic schema validation is handled
   *
   * `undefined`: Defaults - throw error in worst offense
   * 'warn': only ever warn
   * 'silent': Don't bother with processing at all
   *
   * Note: this only applies to non-nested members.
   */
  protected declare static automaticValidation?: 'warn' | 'silent';

  /** Return true to merge incoming data; false keeps existing entity
   *
   * @see https://resthooks.io/docs/api/schema.Entity#useIncoming
   */
  static useIncoming(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return existingMeta.fetchedAt <= incomingMeta.fetchedAt;
  }

  /** Run when an existing entity is found in the store */
  static mergeWithStore(
    existingMeta:
      | {
          date: number;
          fetchedAt: number;
        }
      | undefined,
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    const useIncoming =
      // we may have in store but not in meta; so this existance check is still important
      !existingMeta ||
      this.useIncoming(existingMeta, incomingMeta, existing, incoming);

    if (useIncoming) {
      // distinct types are not mergeable, so just replace
      if (typeof incoming !== typeof existing) {
        return incoming;
      } else {
        return this.merge(existing, incoming);
      }
    } else {
      return existing;
    }
  }

  /** Factory method to convert from Plain JS Objects.
   *
   * @param [props] Plain Object of properties to assign.
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
   */
  declare static pk: <T extends typeof Entity>(
    this: T,
    value: Partial<AbstractInstanceType<T>>,
    parent?: any,
    key?: string,
  ) => string | undefined;

  /** Do any transformations when first receiving input */
  static process(input: any, parent: any, key: string | undefined): any {
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
Or use debugging tools: https://resthooks.io/docs/guides/debugging
Learn more about schemas: https://resthooks.io/docs/api/schema
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

    return super.process(input, parent, key);
  }

  static validate(processedEntity: any): string | undefined {
    /* istanbul ignore else */
    if (
      process.env.NODE_ENV !== 'production' &&
      this.automaticValidation !== 'silent'
    ) {
      const keysOfRecord = new Set(Object.keys(this.defaults));
      const keysOfProps = Object.keys(processedEntity);
      const [found, missing, unexpected] = [[], [], []] as [
        string[],
        string[],
        string[],
      ];
      for (const keyOfProps of keysOfProps) {
        if (keysOfRecord.has(keyOfProps)) {
          found.push(keyOfProps);
        } else {
          unexpected.push(keyOfProps);
        }
      }
      for (const keyOfRecord of keysOfRecord) {
        if (!found.includes(keyOfRecord)) {
          missing.push(keyOfRecord);
        }
      }

      // only bother with this if they used *any* defaults
      if (keysOfRecord.size) {
        const tooManyUnexpected =
          // unexpected compared to members in response
          Math.max(keysOfProps.length / 2, 1) <= unexpected.length &&
          // unexpected compared to what we specified
          keysOfRecord.size > Math.max(unexpected.length, 2) &&
          // as we find more and more be more easily assured it is correct
          found.length ** 1.5 / 2 <= unexpected.length;
        const foundNothing = found.length < Math.min(1, keysOfRecord.size / 2);
        // if we find nothing (we expect at least one member for a pk)
        // or we find too many unexpected members
        if (tooManyUnexpected || foundNothing) {
          let extra = '';
          let reason = 'substantially different than expected keys';
          if (foundNothing) {
            extra += `\n    Missing: ${missing}`;
            reason = 'no matching keys found';
          }
          if (tooManyUnexpected) {
            extra += `\n    Unexpected keys: ${unexpected}`;
            reason = 'a large number of unexpected keys found';
          }
          const errorMessage = `Attempted to initialize ${
            this.name
          } with ${reason}

  This is likely due to a malformed response.
  Try inspecting the network response or fetch() return value.
  Or use debugging tools: https://resthooks.io/docs/guides/debugging
  Learn more about schemas: https://resthooks.io/docs/api/schema
  If this is a mistake, you can disable this check by setting static automaticValidation = 'silent'

  Expected keys:
    Found: ${found}${extra}
  Value (processed): ${JSON.stringify(processedEntity, null, 2)}`;
          if (
            (found.length >= 4 && tooManyUnexpected) ||
            this.automaticValidation === 'warn'
          ) {
            console.warn(errorMessage);
          } else {
            return errorMessage;
          }
        }
      }
    }
    return super.validate(processedEntity);
  }

  static denormalize<T extends typeof Entity>(
    this: T,
    input: any,
    unvisit: UnvisitFunction,
  ): [denormalized: AbstractInstanceType<T>, found: boolean, suspend: boolean] {
    // TODO: remove codecov ignore once denormalize is modified to expect this
    /* istanbul ignore if */
    if (typeof input === 'symbol') {
      return [undefined, true, true] as any;
    }
    // TODO(breaking): Remove fromJS and setLocal call once old versions are no longer supported
    if (isImmutable(input)) {
      if (this.validate((input as any).toJS()))
        return [undefined as any, false, true];
      // Need to set this first so that if it is referenced further within the
      // denormalization the reference will already exist.
      unvisit.setLocal?.(input);
      const [denormEntity, found, deleted] = denormalizeImmutable(
        this.schema,
        input,
        unvisit,
      );
      return [this.fromJS(denormEntity.toObject()) as any, true, deleted];
    }
    let entityCopy: any;
    // new path
    if (input instanceof this) {
      entityCopy = input;
      // TODO(breaking): Remove fromJS and setLocal call once old versions are no longer supported
    } else {
      if (this.validate(input)) {
        return [undefined as any, false, true];
      }
      entityCopy = this.fromJS(input);
      // Need to set this first so that if it is referenced further within the
      // denormalization the reference will already exist.
      unvisit.setLocal?.(entityCopy);
    }

    let deleted = false;

    // note: iteration order must be stable
    Object.keys(this.schema).forEach(key => {
      const schema = this.schema[key];
      const nextInput = (input as any)[key];
      const [value, , deletedItem] = unvisit(nextInput, schema);

      if (deletedItem && !!this.defaults[key]) {
        deleted = true;
      }
      if ((input as any)[key] !== value) {
        // we're cheating because we know it is implemented
        (this as any).set(entityCopy, key, value);
      }
    });

    return [entityCopy, true, deleted];
  }

  /** Used by denormalize to set nested members */
  protected static set?(entity: any, key: string, value: any) {
    entity[key] = value;
  }
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
