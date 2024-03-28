import type {
  Schema,
  EntityInterface,
  PolymorphicInterface,
  SchemaClass,
  LookupIndex,
  LookupEntities,
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
} from './normal.js';
import { EntityFields } from './schemas/EntityFields.js';
import {
  EntityOptions,
  IEntityClass,
  IEntityInstance,
  RequiredPKOptions,
  IDClass,
  Constructor,
  PKClass,
} from './schemas/EntitySchema.js';
import { default as Invalidate } from './schemas/Invalidate.js';
import { default as Query } from './schemas/Query.js';
import type {
  CollectionConstructor,
  SchemaAttributeFunction,
  SchemaFunction,
  UnionResult,
} from './schemaTypes.js';

export { EntityMap, Invalidate, Query };

export type { SchemaClass };

export { EntityInterface } from './interface.js';

export * from './schemaTypes.js';

/**
 * Represents arrays
 * @see https://dataclient.io/rest/api/Array
 */
export class Array<S extends Schema = Schema> implements SchemaClass {
  constructor(
    definition: S,
    schemaAttribute?: S extends EntityMap<infer T> ?
      keyof T | SchemaFunction<keyof S>
    : undefined,
  );

  define(definition: Schema): void;
  readonly isSingleSchema: S extends EntityMap ? false : true;
  readonly schema: S;
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
    storeEntities: any,
    args: any[],
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
    unvisit: (input: any, schema: any) => any,
  ): (S extends EntityMap<infer T> ? T : Denormalize<S>)[];

  queryKey(
    args: readonly any[],
    queryKey: (...args: any) => any,
    lookupIndex: any,
    lookupEntities: any,
  ): undefined;
}

/**
 * Retrieves all entities in cache
 *
 * @see https://dataclient.io/rest/api/AllSchema
 */
export class All<
  S extends EntityMap | EntityInterface = EntityMap | EntityInterface,
> implements SchemaClass
{
  constructor(
    definition: S,
    schemaAttribute?: S extends EntityMap<infer T> ?
      keyof T | SchemaFunction<keyof S>
    : undefined,
  );

  define(definition: Schema): void;
  readonly isSingleSchema: S extends EntityMap ? false : true;
  readonly schema: S;
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
    storeEntities: any,
    args?: any[],
  ): (S extends EntityMap ? UnionResult<S> : Normalize<S>)[];

  _normalizeNullable():
    | (S extends EntityMap ? UnionResult<S> : Normalize<S>)[]
    | undefined;

  _denormalizeNullable(): (S extends EntityMap<infer T> ? T : Denormalize<S>)[];

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): (S extends EntityMap<infer T> ? T : Denormalize<S>)[];

  queryKey(
    // TODO: hack for now to allow for variable arg combinations with Query
    args: [] | [unknown],
    queryKey: (...args: any) => any,
    lookupIndex: LookupIndex,
    lookupEntities: LookupEntities,
  ): any;
}

/**
 * Represents objects with statically known members
 * @see https://dataclient.io/rest/api/Object
 */
export class Object<O extends Record<string, any> = Record<string, Schema>>
  implements SchemaClass
{
  constructor(definition: O);
  define(definition: Schema): void;
  readonly schema: O;
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
    storeEntities: any,
    args?: any[],
  ): NormalizeObject<O>;

  _normalizeNullable(): NormalizedNullableObject<O>;

  _denormalizeNullable(): DenormalizeNullableObject<O>;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): DenormalizeObject<O>;

  queryKey(
    args: readonly any[],
    queryKey: (...args: any) => any,
    lookupIndex: LookupIndex,
    lookupEntities: LookupEntities,
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

export interface UnionConstructor {
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
  readonly schema: Choices;
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
    storeEntities: any,
    args?: any[],
  ): UnionResult<Choices>;

  _normalizeNullable(): UnionResult<Choices> | undefined;

  _denormalizeNullable():
    | AbstractInstanceType<Choices[keyof Choices]>
    | undefined;

  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): AbstractInstanceType<Choices[keyof Choices]>;

  queryKey(
    args: [Args],
    queryKey: (...args: any) => any,
    lookupIndex: LookupIndex,
    lookupEntities: LookupEntities,
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
  constructor(
    definition: Choices,
    schemaAttribute?: Choices extends EntityMap<infer T> ?
      keyof T | SchemaFunction<keyof Choices>
    : undefined,
  );

  define(definition: Schema): void;
  readonly isSingleSchema: Choices extends EntityMap ? false : true;
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
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
    storeEntities: any,
    args?: any[],
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
    unvisit: (input: any, schema: any) => any,
  ): Record<
    string,
    Choices extends EntityMap<infer T> ? T : Denormalize<Choices>
  >;

  queryKey(
    args: readonly any[],
    queryKey: (...args: any) => any,
    lookupIndex: LookupIndex,
    lookupEntities: LookupEntities,
  ): undefined;
}

export type CollectionArrayAdder<S extends PolymorphicInterface> =
  S extends (
    {
      // ensure we are an array type
      denormalize(...args: any): any[];
      // get what we are an array of
      schema: infer T;
    }
  ) ?
    // TODO: eventually we want to allow singular or list and infer the return based on arguments
    T
  : never;

export declare let CollectionRoot: CollectionConstructor;

/**
 * Entities but for Arrays instead of classes
 * @see https://dataclient.io/rest/api/Collection
 */
export declare class Collection<
  S extends any[] | PolymorphicInterface = any,
  Args extends any[] =
    | []
    | [urlParams: Record<string, any>]
    | [urlParams: Record<string, any>, body: any],
  Parent = any,
> extends CollectionRoot<S, Args, Parent> {}

// id is in Instance, so we default to that as pk
/**
 * Represents data that should be deduped by specifying a primary key.
 * @see https://dataclient.io/docs/api/schema.Entity
 */
export function Entity<TBase extends PKClass>(
  Base: TBase,
  opt?: EntityOptions<InstanceType<TBase>>,
): IEntityClass<TBase> & TBase;

// id is in Instance, so we default to that as pk
export function Entity<TBase extends IDClass>(
  Base: TBase,
  opt?: EntityOptions<InstanceType<TBase>>,
): IEntityClass<TBase> & TBase & (new (...args: any[]) => IEntityInstance);

// pk was specified in options, so we don't need to redefine
export function Entity<TBase extends Constructor>(
  Base: TBase,
  opt: RequiredPKOptions<InstanceType<TBase>>,
): IEntityClass<TBase> & TBase & (new (...args: any[]) => IEntityInstance);

/* TODO: figure out how to make abstract class mixins work. until then we will require PK in options
export function Entity<TBase extends Constructor>(
  Base: TBase,
  opt?: EntityOptions<keyof InstanceType<TBase>>,
): (abstract new (...args: any[]) => {
  pk(parent?: any, key?: string): string | number | undefined;
}) &
  IEntityClass<TBase> &
  TBase;
*/
