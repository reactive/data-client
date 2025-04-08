import type {
  Schema,
  EntityInterface,
  PolymorphicInterface,
  SchemaClass,
  IQueryDelegate,
  INormalizeDelegate,
  SchemaSimple,
} from './interface.js';
import type {
  AbstractInstanceType,
  Normalize,
  NormalizeNullable,
  Denormalize,
  DenormalizeNullable,
  DenormalizeObject,
  DenormalizeNullableObject,
  NormalizeObject,
  NormalizedNullableObject,
  EntityMap,
  ObjectArgs,
} from './normal.js';
import { EntityFields } from './schemas/EntityFields.js';
import {
  default as EntityMixin,
  default as Entity,
} from './schemas/EntityMixin.js';
import { default as Query } from './schemas/Query.js';
import type {
  CollectionConstructor,
  DefaultArgs,
  SchemaAttributeFunction,
  SchemaFunction,
  UnionResult,
} from './schemaTypes.js';

export { EntityMap, Query, EntityMixin, Entity };

export type { SchemaClass };

export { EntityInterface } from './interface.js';

export * from './schemaTypes.js';

/**
 * Marks entity as Invalid.
 *
 * This triggers suspense for all endpoints requiring it.
 * Optional (like variable sized Array and Values) will simply remove the item.
 * @see https://dataclient.io/rest/api/Invalidate
 */
export class Invalidate<
  E extends EntityInterface & {
    process: any;
  },
> implements SchemaSimple
{
  /**
   * Marks entity as Invalid.
   *
   * This triggers suspense for all endpoints requiring it.
   * Optional (like variable sized Array and Values) will simply remove the item.
   * @see https://dataclient.io/rest/api/Invalidate
   */
  constructor(entity: E);
  key: string;
  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): string;

  queryKey(args: any, unvisit: unknown, delegate: unknown): undefined;
  denormalize(
    id: string,
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): AbstractInstanceType<E>;

  _denormalizeNullable(): AbstractInstanceType<E> | undefined;
  _normalizeNullable(): string | undefined;
}

/**
 * Represents arrays
 * @see https://dataclient.io/rest/api/Array
 */
export class Array<S extends Schema = Schema> implements SchemaClass {
  /**
   * Represents arrays
   * @see https://dataclient.io/rest/api/Array
   */
  constructor(
    definition: S,
    schemaAttribute?: S extends EntityMap<infer T> ?
      keyof T | SchemaFunction<keyof S>
    : undefined,
  );

  define(definition: Schema): void;
  readonly isSingleSchema: S extends EntityMap ? false : true;
  schemaKey(): string;
  readonly schema: S;
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): (S extends EntityMap ? UnionResult<S> : Normalize<S>)[];

  _normalizeNullable():
    | (S extends EntityMap ? UnionResult<S> : Normalize<S>)[]
    | undefined;

  _denormalizeNullable():
    | (S extends EntityMap<infer T> ? T : Denormalize<S>)[]
    | undefined;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): (S extends EntityMap<infer T> ? T : Denormalize<S>)[];

  queryKey(
    args: readonly any[],
    unvisit: (...args: any) => any,
    delegate: any,
  ): undefined;
}

/**
 * Retrieves all entities in cache
 *
 * @see https://dataclient.io/rest/api/All
 */
export class All<
  S extends EntityMap | EntityInterface = EntityMap | EntityInterface,
> implements SchemaClass
{
  /**
   * Retrieves all entities in cache
   *
   * @see https://dataclient.io/rest/api/All
   */
  constructor(
    definition: S,
    schemaAttribute?: S extends EntityMap<infer T> ?
      keyof T | SchemaFunction<keyof S>
    : undefined,
  );

  define(definition: Schema): void;
  readonly isSingleSchema: S extends EntityMap ? false : true;
  schemaKey(): string;
  readonly schema: S;
  schemaKey(): string;
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): (S extends EntityMap ? UnionResult<S> : Normalize<S>)[];

  _normalizeNullable():
    | (S extends EntityMap ? UnionResult<S> : Normalize<S>)[]
    | undefined;

  _denormalizeNullable():
    | (S extends EntityMap<infer T> ? T : Denormalize<S>)[]
    | undefined;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): (S extends EntityMap<infer T> ? T : Denormalize<S>)[];

  queryKey(
    // TODO: hack for now to allow for variable arg combinations with Query
    args: [] | [unknown],
    unvisit: (...args: any) => any,
    delegate: IQueryDelegate,
  ): any;
}

/**
 * Represents objects with statically known members
 * @see https://dataclient.io/rest/api/Object
 */
export class Object<O extends Record<string, any> = Record<string, any>>
  implements SchemaClass
{
  /**
   * Represents objects with statically known members
   * @see https://dataclient.io/rest/api/Object
   */
  constructor(definition: O);
  define(definition: Schema): void;
  readonly schema: O;
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): NormalizeObject<O>;

  _normalizeNullable(): NormalizedNullableObject<O>;

  _denormalizeNullable(): DenormalizeNullableObject<O>;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): DenormalizeObject<O>;

  queryKey(
    args: ObjectArgs<O>,
    unvisit: (...args: any) => any,
    delegate: IQueryDelegate,
  ): any;
}

type RequiredMember<
  O extends Record<string | number | symbol, unknown>,
  Required extends keyof O,
> = {
  [K in Required]: O[K];
};

type UnionSchemaToArgs<
  Choices extends EntityMap,
  SchemaAttribute extends
    | keyof AbstractInstanceType<Choices[keyof Choices]>
    | SchemaFunction<keyof Choices>,
> =
  SchemaAttribute extends keyof AbstractInstanceType<Choices[keyof Choices]> ?
    RequiredMember<
      AbstractInstanceType<Choices[keyof Choices]>,
      SchemaAttribute
    >
  : SchemaAttribute extends (value: infer Args, ...rest: any) => unknown ? Args
  : never;

/**
 * Represents polymorphic values.
 * @see https://dataclient.io/rest/api/Union
 */
export interface UnionConstructor {
  /**
   * Represents polymorphic values.
   * @see https://dataclient.io/rest/api/Union
   */
  new <
    Choices extends EntityMap,
    SchemaAttribute extends
      | keyof AbstractInstanceType<Choices[keyof Choices]>
      | SchemaFunction<keyof Choices>,
  >(
    definition: Choices,
    schemaAttribute: SchemaAttribute,
  ): UnionInstance<
    Choices,
    UnionSchemaToArgs<Choices, SchemaAttribute> &
      Partial<AbstractInstanceType<Choices[keyof Choices]>>
  >;

  readonly prototype: UnionInstance;
}

/**
 * Represents polymorphic values.
 * @see https://dataclient.io/rest/api/Union
 */
export interface UnionInstance<
  Choices extends EntityMap = any,
  Args extends EntityFields<
    AbstractInstanceType<Choices[keyof Choices]>
  > = EntityFields<AbstractInstanceType<Choices[keyof Choices]>>,
> {
  define(definition: Schema): void;
  inferSchema: SchemaAttributeFunction<Choices[keyof Choices]>;
  getSchemaAttribute: SchemaFunction<keyof Choices>;
  schemaKey(): string;
  readonly schema: Choices;
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): UnionResult<Choices>;

  _normalizeNullable(): UnionResult<Choices> | undefined;

  _denormalizeNullable():
    | AbstractInstanceType<Choices[keyof Choices]>
    | undefined;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): AbstractInstanceType<Choices[keyof Choices]>;

  queryKey(
    args: [Args],
    unvisit: (...args: any) => any,
    delegate: IQueryDelegate,
  ): { id: any; schema: string };
}

/**
 * Represents polymorphic values.
 * @see https://dataclient.io/rest/api/Union
 */
export declare let UnionRoot: UnionConstructor;

/**
 * Represents polymorphic values.
 * @see https://dataclient.io/rest/api/Union
 */
export declare class Union<
  Choices extends EntityMap,
  SchemaAttribute extends
    | keyof AbstractInstanceType<Choices[keyof Choices]>
    | SchemaFunction<keyof Choices>,
> extends UnionRoot<Choices, SchemaAttribute> {}

/**
 * Represents variably sized objects
 * @see https://dataclient.io/rest/api/Values
 */
export class Values<Choices extends Schema = any> implements SchemaClass {
  /**
   * Represents variably sized objects
   * @see https://dataclient.io/rest/api/Values
   */
  constructor(
    definition: Choices,
    schemaAttribute?: Choices extends EntityMap<infer T> ?
      keyof T | SchemaFunction<keyof Choices>
    : undefined,
  );

  define(definition: Schema): void;
  readonly isSingleSchema: Choices extends EntityMap ? false : true;
  schemaKey(): string;
  inferSchema: SchemaAttributeFunction<
    Choices extends EntityMap ? Choices[keyof Choices] : Choices
  >;

  getSchemaAttribute: Choices extends EntityMap ? SchemaFunction<keyof Choices>
  : false;

  readonly schema: Choices;
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): Record<
    string,
    Choices extends EntityMap ? UnionResult<Choices> : Normalize<Choices>
  >;

  _normalizeNullable():
    | Record<
        string,
        Choices extends EntityMap ? UnionResult<Choices>
        : NormalizeNullable<Choices>
      >
    | undefined;

  _denormalizeNullable(): Record<
    string,
    Choices extends EntityMap<infer T> ? T | undefined
    : DenormalizeNullable<Choices>
  >;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): Record<
    string,
    Choices extends EntityMap<infer T> ? T : Denormalize<Choices>
  >;

  queryKey(
    args: readonly any[],
    unvisit: (...args: any) => any,
    delegate: IQueryDelegate,
  ): undefined;
}

export declare let CollectionRoot: CollectionConstructor;

/**
 * Entities but for Arrays instead of classes
 * @see https://dataclient.io/rest/api/Collection
 */
export declare class Collection<
  S extends any[] | PolymorphicInterface = any,
  Args extends any[] = DefaultArgs,
  Parent = any,
> extends CollectionRoot<S, Args, Parent> {}
