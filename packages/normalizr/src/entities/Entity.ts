/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as schema from '@rest-hooks/normalizr/schema';
import {
  AbstractInstanceType,
  Schema,
  NormalizedIndex,
} from '@rest-hooks/normalizr/types';
import {
  isImmutable,
  denormalizeImmutable,
} from '@rest-hooks/normalizr/schemas/ImmutableUtils';

/**
 * Represents data that should be deduped by specifying a primary key.
 * @see https://resthooks.io/docs/api/Entity
 */
export default abstract class Entity {
  static toJSON() {
    return {
      name: this.name,
      schema: this.schema,
      key: this.key,
    };
  }

  /** Defines nested entities */
  static schema: { [k: string]: Schema } = {};

  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  abstract pk(parent?: any, key?: string): string | undefined;

  /** Returns the globally unique identifier for the static Entity */
  static get key(): string {
    /* istanbul ignore next */
    if (
      process.env.NODE_ENV !== 'production' &&
      (this.name === '' || this.name === 'Entity' || this.name === '_temp')
    )
      throw new Error(
        'Entity classes without a name must define `static get key()`',
      );
    return this.name;
  }

  /** Defines indexes to enable lookup by */
  declare static indexes?: readonly string[];

  /** Control how automatic schema validation is handled
   *
   * `undefined`: Defaults - throw error in worst offense
   * 'warn': only ever warn
   * 'silent': Don't bother with processing at all
   *
   * Note: this only applies to non-nested members.
   */
  protected declare static automaticValidation?: 'warn' | 'silent';

  /**
   * A unique identifier for each Entity
   *
   * @param [value] POJO of the entity or subset used
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  static pk<T extends typeof Entity>(
    this: T,
    value: Partial<AbstractInstanceType<T>>,
    parent?: any,
    key?: string,
  ): string | undefined {
    return this.prototype.pk.call(value, parent, key);
  }

  /** Creates new instance copying over defined values of arguments */
  static merge<T extends typeof Entity>(
    this: T,
    existing: Partial<AbstractInstanceType<T>>,
    incoming: Partial<AbstractInstanceType<T>>,
  ) {
    return { ...existing, ...incoming };
  }

  /** Factory method to convert from Plain JS Objects.
   *
   * @param [props] Plain Object of properties to assign.
   * @param [parent] When normalizing, the object which included the record
   * @param [key] When normalizing, the key where this record was found
   */
  static fromJS<T extends typeof Entity>(
    this: T,
    // TODO: this should only accept members that are not functions
    props: Partial<AbstractInstanceType<T>> = {},
  ): AbstractInstanceType<T> {
    // we type guarded abstract case above, so ok to force typescript to allow constructor call
    const instance = new (this as any)(props) as AbstractInstanceType<T>;
    // we can't rely on constructors and override the defaults provided as property assignments
    // all occur after the constructor
    Object.assign(instance, props);
    return instance;
  }

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

    return { ...input };
  }

  static normalize(
    input: any,
    parent: any,
    key: string | undefined,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
  ): any {
    // pass over already processed entities
    if (typeof input === 'string') return input;
    const processedEntity = this.process(input, parent, key);
    const id = this.pk(processedEntity, parent, key);
    if (id === undefined || id === '') {
      if (process.env.NODE_ENV !== 'production') {
        const error = new Error(
          `Missing usable primary key when normalizing response.

  This is likely due to a malformed response.
  Try inspecting the network response or fetch() return value.
  Or use debugging tools: https://resthooks.io/docs/guides/debugging
  Learn more about schemas: https://resthooks.io/docs/api/schema

  Entity: ${this.name}
  Value (processed): ${
    processedEntity && JSON.stringify(processedEntity, null, 2)
  }
  `,
        );
        (error as any).status = 400;
        throw error;
      } else {
        // these make the keys get deleted
        return undefined;
      }
    }
    const entityType = this.key;

    if (!(entityType in visitedEntities)) {
      visitedEntities[entityType] = {};
    }
    if (!(id in visitedEntities[entityType])) {
      visitedEntities[entityType][id] = [];
    }
    if (
      visitedEntities[entityType][id].some((entity: any) => entity === input)
    ) {
      return id;
    }
    const errorMessage = this.validate(processedEntity);
    if (errorMessage) {
      const error = new Error(errorMessage);
      (error as any).status = 400;
      throw error;
    }
    visitedEntities[entityType][id].push(input);

    Object.keys(this.schema).forEach(key => {
      if (Object.prototype.hasOwnProperty.call(processedEntity, key)) {
        const schema = this.schema[key];
        processedEntity[key] = visit(
          processedEntity[key],
          processedEntity,
          key,
          schema,
          addEntity,
          visitedEntities,
        );
      }
    });

    addEntity(this, processedEntity, id);
    return id;
  }

  protected static validate(processedEntity: any): string | undefined {
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
    if (process.env.NODE_ENV !== 'production') {
      for (const key of Object.keys(this.schema)) {
        if (!Object.prototype.hasOwnProperty.call(processedEntity, key)) {
          if (!Object.prototype.hasOwnProperty.call(this.defaults, key)) {
            return `Schema key is missing in Entity

  Be sure all schema members are also part of the entity
  Or use debugging tools: https://resthooks.io/docs/guides/debugging
  Learn more about nesting schemas: https://resthooks.io/docs/guides/nested-response

  Entity keys: ${Object.keys(this.defaults)}
  Schema key(missing): ${key}
  `;
          }
        }
      }
    }
  }

  static infer(args: any[], indexes: NormalizedIndex, recurse: any): any {
    if (!args[0]) return undefined;
    const id = this.pk(args[0], undefined, '');
    // Was able to infer the entity's primary key from params
    if (id !== undefined && id !== '') return id;
    // now attempt lookup in indexes
    const indexName = indexFromParams(args[0], this.indexes);
    if (indexName && indexes[this.key]) {
      // 'as Record<string, any>': indexName can only be found if params is a string key'd object
      const id =
        indexes[this.key][indexName][
          (args[0] as Record<string, any>)[indexName]
        ];
      return id;
    }
    return undefined;
  }

  static expiresAt(
    meta: { expiresAt: number; date: number },
    input: any,
  ): number {
    return meta.expiresAt;
  }

  static denormalize<T extends typeof Entity>(
    this: T,
    input: Readonly<Partial<AbstractInstanceType<T>>>,
    unvisit: schema.UnvisitFunction,
    globalKey: object[],
  ): [denormalized: AbstractInstanceType<T>, found: boolean, suspend: boolean] {
    if (isImmutable(input)) {
      this.validate((input as any).toJS());
      // Need to set this first so that if it is referenced further within the
      // denormalization the reference will already exist.
      unvisit.setLocal?.(input);
      const [denormEntity, found, deleted] = denormalizeImmutable(
        this.schema,
        input,
        unvisit,
        globalKey,
      );
      return [this.fromJS(denormEntity.toObject()), found, deleted];
    }
    if (this.validate(input)) {
      return [undefined as any, false, true];
    }
    const entityCopy: any = this.fromJS(input);
    // Need to set this first so that if it is referenced further within the
    // denormalization the reference will already exist.
    unvisit.setLocal?.(entityCopy);

    let deleted = false;

    // note: iteration order must be stable
    Object.keys(this.schema).forEach(key => {
      const schema = this.schema[key];
      const nextInput = Object.prototype.hasOwnProperty.call(input, key)
        ? (input as any)[key]
        : undefined;
      const [value, , deletedItem] = unvisit(nextInput, schema, globalKey);

      if (
        deletedItem &&
        !(
          Object.prototype.hasOwnProperty.call(input, key) &&
          !this.defaults[key]
        )
      ) {
        deleted = true;
      }
      if (
        Object.prototype.hasOwnProperty.call(input, key) &&
        (input as any)[key] !== value
      ) {
        this.set(entityCopy, key, value);
      }
    });

    return [entityCopy, true, deleted];
  }

  private declare static __defaults: any;
  /** All instance defaults set */
  protected static get defaults() {
    if (!Object.prototype.hasOwnProperty.call(this, '__defaults'))
      this.__defaults = new (this as any)();
    return this.__defaults;
  }

  /** Used by denormalize to set nested members */
  protected static set(entity: any, key: string, value: any) {
    entity[key] = value;
  }
}

if (process.env.NODE_ENV !== 'production') {
  const superFrom = Entity.fromJS;
  // for those not using TypeScript this is a good catch to ensure they are defining
  // the abstract members
  Entity.fromJS = function fromJS<T extends typeof Entity>(
    this: T,
    props: Partial<AbstractInstanceType<T>>,
  ): AbstractInstanceType<T> {
    if ((this as any).prototype.pk === undefined)
      throw new Error('cannot construct on abstract types');
    return superFrom.call(this, props) as any;
  };
}

export function isEntity(schema: Schema): schema is typeof Entity {
  return schema !== null && (schema as any).pk !== undefined;
}

function indexFromParams<I extends string>(
  params: Readonly<object>,
  indexes?: Readonly<I[]>,
) {
  if (!indexes) return undefined;
  return indexes.find(index =>
    Object.prototype.hasOwnProperty.call(params, index),
  );
}
