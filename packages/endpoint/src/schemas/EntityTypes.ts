import type { Schema, IQueryDelegate } from '../interface.js';
import { AbstractInstanceType } from '../normal.js';

/**
 * Entity defines a single (globally) unique object.
 * @see https://dataclient.io/rest/api/EntityMixin
 */
export interface IEntityClass<TBase extends Constructor = any> {
  toJSON(): {
    name: string;
    schema: {
      [k: string]: Schema;
    };
    key: string;
  };
  /** Defines nested entities
   *
   * @see https://dataclient.io/rest/api/Entity#schema
   */
  schema: {
    [k: string]: Schema;
  };
  /** Returns the globally unique identifier for the static Entity
   *
   * @see https://dataclient.io/rest/api/Entity#key
   */
  key: string;
  /** Defines indexes to enable lookup by
   *
   * @see https://dataclient.io/rest/api/Entity#indexes
   */
  indexes?: readonly string[] | undefined;
  /**
   * A unique identifier for each Entity
   *
   * @see https://dataclient.io/rest/api/Entity#pk
   * @param [value] POJO of the entity or subset used
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   * @param [args] ...args sent to Endpoint
   */
  pk<
    T extends (abstract new (
      ...args: any[]
    ) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    value: Partial<AbstractInstanceType<T>>,
    parent?: any,
    key?: string,
    args?: any[],
  ): string | number | undefined;
  /** Return true to merge incoming data; false keeps existing entity
   *
   * @see https://dataclient.io/docs/api/Entity#shouldUpdate
   */
  shouldUpdate(
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
  /** Determines the order of incoming entity vs entity already in store
   *
   * @see https://dataclient.io/docs/api/Entity#shouldReorder
   * @returns true if incoming entity should be first argument of merge()
   */
  shouldReorder(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ): boolean;
  /** Creates new instance copying over defined values of arguments
   *
   * @see https://dataclient.io/docs/api/Entity#merge
   */
  merge(existing: any, incoming: any): any;
  /** Run when an existing entity is found in the store
   *
   * @see https://dataclient.io/docs/api/Entity#mergeWithStore
   */
  mergeWithStore(
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
  ): any;
  /** Run when an existing entity is found in the store
   *
   * @see https://dataclient.io/docs/api/Entity#mergeMetaWithStore
   */
  mergeMetaWithStore(
    existingMeta: {
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    incomingMeta: { expiresAt: number; date: number; fetchedAt: number },
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
  fromJS<
    T extends (abstract new (
      ...args: any[]
    ) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    props?: Partial<AbstractInstanceType<T>>,
  ): AbstractInstanceType<T>;
  /** Called when denormalizing an entity to create an instance when 'valid'
   *
   * @param [props] Plain Object of properties to assign.
   * @see https://dataclient.io/rest/api/Entity#createIfValid
   */
  createIfValid<
    T extends (abstract new (
      ...args: any[]
    ) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    props: Partial<AbstractInstanceType<T>>,
  ): AbstractInstanceType<T> | undefined;
  /** Do any transformations when first receiving input
   *
   * @see https://dataclient.io/rest/api/Entity#process
   */
  process(input: any, parent: any, key: string | undefined, args: any[]): any;
  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
    visit: (...args: any) => any,
    snapshot: { getEntity: any; setEntity: any },
  ): any;
  /** Do any transformations when first receiving input
   *
   * @see https://dataclient.io/rest/api/Entity#validate
   */
  validate(processedEntity: any): string | undefined;
  /** Builds a key access the entity without endpoint results
   *
   * @see https://dataclient.io/rest/api/Entity#queryKey
   */
  queryKey(args: readonly any[], unvisit: any, delegate: IQueryDelegate): any;
  denormalize<
    T extends (abstract new (
      ...args: any[]
    ) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    input: any,
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): AbstractInstanceType<T>;
  /** All instance defaults set */
  readonly defaults: any;
}
export interface IEntityInstance {
  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   * @param [args] ...args sent to Endpoint
   */
  pk(
    parent?: any,
    key?: string,
    args?: readonly any[],
  ): string | number | undefined;
}

export type Constructor = abstract new (...args: any[]) => {};
export type IDClass = abstract new (...args: any[]) => {
  id: string | number | undefined;
};
export type PKClass = abstract new (...args: any[]) => {
  pk(
    parent?: any,
    key?: string,
    args?: readonly any[],
  ): string | number | undefined;
};
// TODO: Figure out what Schema must be for each key
type ValidSchemas<TInstance> = {
  [k in keyof TInstance]?: Schema;
};

export type EntityOptions<TInstance extends {}> = {
  readonly schema?: ValidSchemas<TInstance>;
  readonly pk?:
    | ((
        value: TInstance,
        parent?: any,
        key?: string,
      ) => string | number | undefined)
    | keyof TInstance;
  readonly key?: string;
} & {
  readonly [K in Extract<
    keyof IEntityClass,
    | 'process'
    | 'merge'
    | 'expiresAt'
    | 'createIfValid'
    | 'mergeWithStore'
    | 'validate'
    | 'shouldReorder'
    | 'shouldUpdate'
  >]?: IEntityClass<abstract new (...args: any[]) => TInstance>[K];
};

export interface RequiredPKOptions<
  TInstance extends {},
> extends EntityOptions<TInstance> {
  readonly pk:
    | ((
        value: TInstance,
        parent?: any,
        key?: string,
      ) => string | number | undefined)
    | keyof TInstance;
}
