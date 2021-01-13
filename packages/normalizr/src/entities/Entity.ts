/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import SimpleRecord from './SimpleRecord';
import { isImmutable, denormalizeImmutable } from '../schemas/ImmutableUtils';
import * as schema from '../schema';
import { AbstractInstanceType, Schema } from '../types';

/** Represents data that should be deduped by specifying a primary key. */
export default abstract class Entity extends SimpleRecord {
  static toJSON() {
    return {
      ...super.toJSON(),
      key: this.key,
    };
  }

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
      (this.name === '' || this.name === 'Entity')
    )
      throw new Error(
        'Entity classes without a name must define `static get key()`',
      );
    return this.name;
  }

  /** Defines indexes to enable lookup by */
  declare static indexes?: readonly string[];

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
    return this.prototype.pk.call(value, parent, key) || key;
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
    // TODO: what's store needs to be a differing type from fromJS
    const processedEntity = this.fromJS(input, parent, key);
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const instanceSample = new (this as any)();
      const keysOfRecord = new Set(Object.keys(instanceSample));
      const keysOfProps = this.keysDefined(processedEntity);
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

      // if we find nothing, or we find too many unexpected members
      if (
        ((Math.max(keysOfProps.length / 2, 1) <= unexpected.length &&
          keysOfRecord.size > Math.max(unexpected.length, 2)) ||
          found.length < Math.min(1, keysOfRecord.size / 2)) &&
        keysOfRecord.size
      ) {
        const error = new Error(
          `Attempted to initialize ${
            this.name
          } with substantially different than expected keys

  This is likely due to a malformed response.
  Try inspecting the network response or fetch() return value.

  Expected keys:
    Found: ${found}
    Missing: ${missing}
  Unexpected keys: ${unexpected}
  Value: ${JSON.stringify(this.toObjectDefined(processedEntity), null, 2)}`,
        );
        (error as any).status = 400;
        throw error;
      }
    }
    const id = processedEntity.pk(parent, key);
    if (id === undefined || id === '') {
      if (process.env.NODE_ENV !== 'production') {
        const error = new Error(
          `Missing usable resource key when normalizing response.

  This is likely due to a malformed response.
  Try inspecting the network response or fetch() return value.

  Entity: ${this.name}
  Value: ${input && JSON.stringify(input, null, 2)}
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
    visitedEntities[entityType][id].push(input);

    Object.keys(this.schema).forEach(key => {
      if (Object.hasOwnProperty.call(processedEntity, key)) {
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

    addEntity(this, processedEntity, processedEntity, parent, key);
    return id;
  }

  static denormalize<T extends typeof SimpleRecord>(
    this: T,
    input: AbstractInstanceType<T>,
    unvisit: schema.UnvisitFunction,
  ): [AbstractInstanceType<T>, boolean, boolean] {
    // TODO: this entire function is redundant with SimpleRecord, however right now we're storing the Entity instance
    // itself in cache. Once we offer full memoization, we will store raw objects and this can be consolidated with SimpleRecord
    if (isImmutable(input)) {
      const [denormEntity, found, deleted] = denormalizeImmutable(
        this.schema,
        input,
        unvisit,
      );
      return [this.fromJS(denormEntity.toObject()), found, deleted];
    }
    // TODO: This creates unneeded memory pressure
    const instance = new (this as any)();
    let deleted = false;
    let found = true;
    const denormEntity = input;

    // note: iteration order must be stable
    Object.keys(this.schema).forEach(key => {
      const schema = this.schema[key];
      const nextInput = this.hasDefined(input, key as any)
        ? input[key]
        : undefined;
      const [value, foundItem, deletedItem] = unvisit(nextInput, schema);
      // members who default to falsy values are considered 'optional'
      // if falsy value, and default is actually set then it is optional so pass through
      if (!foundItem && !(key in instance && !instance[key])) {
        found = false;
      }
      if (deletedItem && !(key in instance && !instance[key])) {
        deleted = true;
      }
      if (this.hasDefined(input, key as any) && denormEntity[key] !== value) {
        denormEntity[key] = value;
      }
    });

    return [denormEntity as any, found, deleted];
  }
}

if (process.env.NODE_ENV !== 'production') {
  // for those not using TypeScript this is a good catch to ensure they are defining
  // the abstract members
  Entity.fromJS = function fromJS<T extends typeof SimpleRecord>(
    this: T,
    props: Partial<AbstractInstanceType<T>>,
  ): AbstractInstanceType<T> {
    if ((this as any).prototype.pk === undefined)
      throw new Error('cannot construct on abstract types');
    return SimpleRecord.fromJS.call(this, props) as any;
  };
}

export function isEntity(schema: Schema | null): schema is typeof Entity {
  return schema !== null && (schema as any).pk !== undefined;
}
