// we just removed instances of 'abstract new'
import { Schema, NormalizedIndex, UnvisitFunction } from '../interface.js';
import { AbstractInstanceType } from '../normal.js';
export type Constructor = new (...args: any[]) => {};
export type IDClass = new (...args: any[]) => {
  id: string | number | undefined;
};
export type PKClass = new (...args: any[]) => {
  pk(parent?: any, key?: string): string | undefined;
};
type ValidSchemas<TInstance> = {
  [k in keyof TInstance]?: Schema;
};
export type EntityOptions<TInstance extends {}> = {
  readonly schema?: ValidSchemas<TInstance>;
  readonly pk?:
    | ((value: TInstance, parent?: any, key?: string) => string | undefined)
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
    | 'useIncoming'
  >]?: IEntityClass<new (...args: any[]) => TInstance>[K];
};
export interface RequiredPKOptions<TInstance extends {}>
  extends EntityOptions<TInstance> {
  readonly pk:
    | ((value: TInstance, parent?: any, key?: string) => string | undefined)
    | keyof TInstance;
}
export default function EntitySchema<TBase extends Constructor>(
  Base: TBase,
  options?: EntityOptions<InstanceType<TBase>>,
): any;
export interface IEntityClass<TBase extends Constructor = any> {
  toJSON(): {
    name: string;
    schema: {
      [k: string]: Schema;
    };
    key: string;
  };
  /** Defines nested entities */
  schema: {
    [k: string]: Schema;
  };
  /** Returns the globally unique identifier for the static Entity */
  key: string;
  /** Defines indexes to enable lookup by */
  indexes?: readonly string[] | undefined;
  /**
   * A unique identifier for each Entity
   *
   * @param [value] POJO of the entity or subset used
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  pk<
    T extends (new (...args: any[]) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    value: Partial<AbstractInstanceType<T>>,
    parent?: any,
    key?: string,
  ): string | undefined;
  /** Return true to merge incoming data; false keeps existing entity
   *
   * @see https://resthooks.io/docs/api/schema.Entity#useIncoming
   */
  useIncoming(
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
  /** Determines the order of incoming entity vs entity already in store\
   *
   * @see https://resthooks.io/docs/api/schema.Entity#shouldReorder
   * @returns true if incoming entity should be first argument of merge()
   */
  shouldReorder(
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
  /** Creates new instance copying over defined values of arguments */
  merge(existing: any, incoming: any): any;
  /** Run when an existing entity is found in the store */
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
  /** Factory method to convert from Plain JS Objects.
   *
   * @param [props] Plain Object of properties to assign.
   */
  fromJS<
    T extends (new (...args: any[]) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    props?: Partial<AbstractInstanceType<T>>,
  ): AbstractInstanceType<T>;
  /** Factory method to convert from Plain JS Objects.
   *
   * @param [props] Plain Object of properties to assign.
   */
  createIfValid<
    T extends (new (...args: any[]) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    props: Partial<AbstractInstanceType<T>>,
  ): AbstractInstanceType<T> | undefined;
  /** Do any transformations when first receiving input */
  process(input: any, parent: any, key: string | undefined): any;
  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
  ): any;
  validate(processedEntity: any): string | undefined;
  infer(args: readonly any[], indexes: NormalizedIndex, recurse: any): any;
  expiresAt(
    meta: {
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    input: any,
  ): number;
  denormalize<
    T extends (new (...args: any[]) => IEntityInstance & InstanceType<TBase>) &
      IEntityClass &
      TBase,
  >(
    this: T,
    input: any,
    unvisit: UnvisitFunction,
  ): [
    /*denormalized*/ AbstractInstanceType<T>,
    /*found*/ boolean,
    /*suspend*/ boolean,
  ];
  /** All instance defaults set */
  readonly defaults: any;
}
export interface IEntityInstance {
  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  pk(parent?: any, key?: string): string | undefined;
}
export {};
//# sourceMappingURL=EntitySchema.d.ts.map
