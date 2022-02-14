/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Entity } from '@rest-hooks/endpoint';
import type { AbstractInstanceType } from '@rest-hooks/endpoint';

const DefinedMembersKey = Symbol('Defined Members');
const UniqueIdentifierKey = Symbol('unq');
type Filter<T, U> = T extends U ? T : never;
interface SimpleResourceMembers<T extends typeof EntityRecord> {
  [DefinedMembersKey]: Partial<AbstractInstanceType<T>>;
}

/** Immutable record that keeps track of which members are defined vs defaults. */
export default abstract class EntityRecord extends Entity {
  toString(): string {
    // we don't make _unq a member so it doesn't play a role in type compatibility
    return (this as any)[UniqueIdentifierKey];
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
    if (props instanceof EntityRecord) {
      props = (props.constructor as any).toObjectDefined(props);
    }
    const instance: any = super.fromJS(props);

    Object.defineProperty(instance, DefinedMembersKey, {
      value: { ...props },
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
  static mergeRecord<T extends typeof Entity>(
    this: T,
    existing: AbstractInstanceType<T>,
    incoming: AbstractInstanceType<T>,
  ) {
    const props = Object.assign(
      (this as any).toObjectDefined(existing),
      (this as any).toObjectDefined(incoming),
    );
    return this.fromJS(props);
  }

  /** Whether key is non-default */
  static hasDefined<T extends typeof EntityRecord>(
    this: T,
    instance: AbstractInstanceType<T>,
    key: Filter<keyof AbstractInstanceType<T>, string>,
  ) {
    return Object.hasOwnProperty.call(
      (instance as any as SimpleResourceMembers<T>)[DefinedMembersKey],
      key,
    );
  }

  /** Returns simple object with all the non-default members */
  static toObjectDefined<T extends typeof EntityRecord>(
    this: T,
    instance: AbstractInstanceType<T>,
  ) {
    return (instance as any as SimpleResourceMembers<T>)[DefinedMembersKey];
  }

  /** Returns array of all keys that have values defined in instance */
  static keysDefined<T extends typeof EntityRecord>(
    this: T,
    instance: AbstractInstanceType<T>,
  ): Filter<keyof AbstractInstanceType<T>, string>[] {
    return Object.keys(
      (instance as any as SimpleResourceMembers<T>)[DefinedMembersKey],
    ) as any;
  }

  /** Used by denormalize to set nested members */
  protected static set(entity: any, key: string, value: any) {
    entity[key] = value;
    entity[DefinedMembersKey][key] = value;
  }
}
