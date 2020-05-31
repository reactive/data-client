/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { AbstractInstanceType, Schema, NormalizedEntity } from '../types';
import { normalize, denormalize } from '../schemas/Object';

const DefinedMembersKey = Symbol('Defined Members');
const UniqueIdentifierKey = Symbol('unq');
type Filter<T, U> = T extends U ? T : never;
interface SimpleResourceMembers<T extends typeof SimpleRecord> {
  [DefinedMembersKey]: Filter<keyof AbstractInstanceType<T>, string>[];
}

/** Immutable record that keeps track of which members are defined vs defaults. */
export default abstract class SimpleRecord {
  toString(): string {
    // we don't make _unq a member so it doesn't play a role in type compatibility
    return (this as any)[UniqueIdentifierKey];
  }

  /** Defines nested entities */
  static schema: { [k: string]: Schema } = {};

  /** Factory method to convert from Plain JS Objects.
   *
   * @param [props] Plain Object of properties to assign.
   * @param [parent] When normalizing, the object which included the record
   * @param [key] When normalizing, the key where this record was found
   */
  static fromJS<T extends typeof SimpleRecord>(
    this: T,
    // TODO: this should only accept members that are not functions
    props: Partial<AbstractInstanceType<T>> = {},
    parent?: any,
    key?: string,
  ) {
    // we type guarded abstract case above, so ok to force typescript to allow constructor call
    const instance = new (this as any)(props) as AbstractInstanceType<T>;
    if (props instanceof SimpleRecord) {
      props = (props.constructor as any).toObjectDefined(props);
    }
    Object.assign(instance, props);

    Object.defineProperty(instance, DefinedMembersKey, {
      value: Object.keys(props),
      writable: false,
    });

    // a 'unique' identifier to make referential equality comparisons easy
    Object.defineProperty(instance, UniqueIdentifierKey, {
      value: `${Math.random()}`,
      writable: false,
    });

    return instance;
  }

  /** Creates new instance copying over defined values of arguments */
  static merge<T extends typeof SimpleRecord>(
    this: T,
    existing: AbstractInstanceType<T>,
    incoming: AbstractInstanceType<T>,
  ) {
    const props = Object.assign(
      this.toObjectDefined(existing),
      this.toObjectDefined(incoming),
    );
    return this.fromJS(props);
  }

  /** Whether key is non-default */
  static hasDefined<T extends typeof SimpleRecord>(
    this: T,
    instance: AbstractInstanceType<T>,
    key: Filter<keyof AbstractInstanceType<T>, string>,
  ) {
    return ((instance as any) as SimpleResourceMembers<T>)[
      DefinedMembersKey
    ].includes(key);
  }

  /** Returns simple object with all the non-default members */
  static toObjectDefined<T extends typeof SimpleRecord>(
    this: T,
    instance: AbstractInstanceType<T>,
  ) {
    const defined: Partial<AbstractInstanceType<T>> = {};
    for (const member of ((instance as any) as SimpleResourceMembers<T>)[
      DefinedMembersKey
    ]) {
      defined[member] = instance[member];
    }
    return defined;
  }

  /** Returns array of all keys that have values defined in instance */
  static keysDefined<T extends typeof SimpleRecord>(
    this: T,
    instance: AbstractInstanceType<T>,
  ) {
    return ((instance as any) as SimpleResourceMembers<T>)[DefinedMembersKey];
  }

  static normalize<T extends typeof SimpleRecord>(
    this: T,
    ...args: any[]
  ): NormalizedEntity<T> {
    return normalize(this.schema, ...args) as any;
  }

  static denormalize<T extends typeof SimpleRecord>(
    this: T,
    input: any,
    unvisit: any,
  ): [AbstractInstanceType<T>, boolean] {
    // TODO: This creates unneeded memory pressure
    const instance = new (this as any)();
    const object = { ...input };
    let found = true;
    Object.keys(this.schema).forEach(key => {
      const [item, foundItem] = unvisit(object[key], this.schema[key]);
      if (object[key] !== undefined) {
        object[key] = item;
      }
      // members who default to falsy values are considered 'optional'
      // if falsy value, and default is actually set then it is optional so pass through
      if (!foundItem && !(key in instance && !instance[key])) {
        found = false;
      }
    });

    // useDenormalized will memo based on entities, so creating a new object each time is fine
    return [this.fromJS(object) as any, found];
  }

  /* istanbul ignore next */
  static asSchema<T extends typeof SimpleRecord>(this: T) {
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'development') {
      console.error('asSchema() is deprecated - use Entity directly instead.');
    }
    /* istanbul ignore next */
    return this;
  }
}
