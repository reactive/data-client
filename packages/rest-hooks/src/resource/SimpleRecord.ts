import { EntityInstance } from 'rest-hooks/types';

const DefinedMembersKey = Symbol('Defined Members');
type Filter<T, U> = T extends U ? T : never;
interface SimpleResourceMembers<T extends typeof SimpleRecord> {
  [DefinedMembersKey]: Filter<keyof EntityInstance<T>, string>[];
}

/** Immutable record that keeps track of which members are defined vs defaults. */
export default abstract class SimpleRecord {
  toString(): string {
    // we don't make _unq a member so it doesn't play a role in type compatibility
    return (this as any)._unq;
  }

  /** Factory method to convert from Plain JS Objects.
   *
   * @param [props] Plain Object of properties to assign.
   * @param [parent] When normalizing, the object which included the record
   * @param [key] When normalizing, the key where this record was found
   */
  static fromJS<T extends typeof SimpleRecord>(
    this: T,
    props: Partial<EntityInstance<T>>,
    parent?: any,
    key?: string,
  ) {
    // we type guarded abstract case above, so ok to force typescript to allow constructor call
    const instance = new (this as any)(props) as EntityInstance<T>;

    Object.defineProperty(instance, DefinedMembersKey, {
      value: Object.keys(props),
      writable: false,
    });

    // a 'unique' identifier to make referential equality comparisons easy
    Object.defineProperty(instance, '_unq', {
      value: `${Math.random()}`,
      writable: false,
    });

    Object.assign(instance, props);

    // to trick normalizr into thinking we're Immutable.js does it doesn't copy
    // TODO: remove when schemas.EntitySchema is deleted as this will not longer be needed
    Object.defineProperty(instance, '__ownerID', {
      value: 1337,
      writable: false,
    });
    return instance;
  }

  /** Creates new instance copying over defined values of arguments */
  static merge<T extends typeof SimpleRecord>(
    this: T,
    first: EntityInstance<T>,
    second: EntityInstance<T>,
  ) {
    const props = Object.assign(
      {},
      this.toObjectDefined(first),
      this.toObjectDefined(second),
    );
    return this.fromJS(props);
  }

  /** Whether key is non-default */
  static hasDefined<T extends typeof SimpleRecord>(
    this: T,
    instance: EntityInstance<T>,
    key: Filter<keyof EntityInstance<T>, string>,
  ) {
    return ((instance as any) as SimpleResourceMembers<T>)[
      DefinedMembersKey
    ].includes(key);
  }

  /** Returns simple object with all the non-default members */
  static toObjectDefined<T extends typeof SimpleRecord>(
    this: T,
    instance: EntityInstance<T>,
  ) {
    const defined: Partial<EntityInstance<T>> = {};
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
    instance: EntityInstance<T>,
  ) {
    return ((instance as any) as SimpleResourceMembers<T>)[DefinedMembersKey];
  }
}
