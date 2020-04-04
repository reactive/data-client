import { Schema } from './types';
import { EntitySchema } from './entities/Entity';

export type StrategyFunction<T> = (value: any, parent: any, key: string) => T;
export type SchemaFunction<K = string> = (
  value: any,
  parent: any,
  key: string,
) => K;
export type MergeFunction = (entityA: any, entityB: any) => any;
export type SchemaAttributeFunction<S extends Schema> = (
  value: any,
  parent: any,
  key: string,
) => S;
export type EntityMap<T = any> = Record<string, EntitySchema<T>>;
export type UnvisitFunction = (input: any, schema: any) => [any, boolean];
export type UnionResult<Choices extends EntityMap> = {
  id: string;
  schema: keyof Choices;
};

export interface SchemaClass {
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: Function,
    addEntity: Function,
    visitedEntities: Record<string, any>,
  ): any;
  // this is not an actual member, but is needed for the recursive NormalizeNullable<> type algo
  _normalizeNullable(): any;
  denormalize(input: any, unvisit: UnvisitFunction): [any, boolean];
  // this is not an actual member, but is needed for the recursive DenormalizeNullable<> type algo
  _denormalizeNullable(): [any, boolean];
}

interface EntityInterface<T = any> extends SchemaClass {
  pk(params: any, parent?: any, key?: string): string | undefined;
  readonly key: string;
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: Function,
    addEntity: Function,
    visitedEntities: Record<string, any>,
  ): string;
  denormalize(entity: any, unvisit: Function): [T, boolean];
  _normalizeNullable(): string | undefined;
  _denormalizeNullable(): [T | undefined, boolean];
}

export class Array<S extends Schema = Schema> implements SchemaClass {
  constructor(definition: S, schemaAttribute?: string | SchemaFunction);
  define(definition: Schema): void;
  readonly schema: S;
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: Function,
    addEntity: Function,
    visitedEntities: Record<string, any>,
  ): Normalize<S>[];

  _normalizeNullable(): Normalize<S>[] | undefined;

  denormalize(
    input: any,
    unvisit: UnvisitFunction,
  ): [Denormalize<S>[], boolean];

  _denormalizeNullable(): [Denormalize<S>[] | undefined, false];
}

export class Object<O extends Record<string, any> = Record<string, Schema>>
  implements SchemaClass {
  constructor(definition: O);
  define(definition: Schema): void;
  readonly schema: O;
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: Function,
    addEntity: Function,
    visitedEntities: Record<string, any>,
  ): NormalizeObject<O>;

  _normalizeNullable(): NormalizedNullableObject<O>;

  denormalize(
    input: any,
    unvisit: UnvisitFunction,
  ): [DenormalizeObject<O>, boolean];

  _denormalizeNullable(): [DenormalizeNullableObject<O>, false];
}

export class Union<Choices extends EntityMap = any> implements SchemaClass {
  constructor(
    definition: Choices,
    schemaAttribute:
      | (Choices[keyof Choices] extends EntityInterface<infer T>
          ? keyof T
          : never)
      | SchemaFunction<keyof Choices>,
  );

  define(definition: Schema): void;
  inferSchema: SchemaAttributeFunction<Choices[keyof Choices]>;
  getSchemaAttribute: SchemaFunction<keyof Choices>;
  readonly schema: Choices;
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: Function,
    addEntity: Function,
    visitedEntities: Record<string, any>,
  ): UnionResult<Choices>;

  _normalizeNullable(): UnionResult<Choices> | undefined;

  denormalize(
    input: any,
    unvisit: UnvisitFunction,
  ): [
    Choices[keyof Choices] extends EntityInterface<infer T> ? T : never,
    boolean,
  ];

  _denormalizeNullable(): [
    Choices[keyof Choices] extends EntityInterface<infer T>
      ? T | undefined
      : never,
    false,
  ];
}

export class Values<Choices extends Schema = any> implements SchemaClass {
  constructor(
    definition: Choices,
    schemaAttribute?: Choices extends EntityMap<infer T>
      ? keyof T | SchemaFunction<keyof Choices>
      : undefined,
  );

  define(definition: Schema): void;
  readonly isSingleSchema: Choices extends EntityMap ? false : true;
  inferSchema: SchemaAttributeFunction<
    Choices extends EntityMap ? Choices[keyof Choices] : Choices
  >;

  getSchemaAttribute: Choices extends EntityMap
    ? SchemaFunction<keyof Choices>
    : false;

  readonly schema: Choices;
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: Function,
    addEntity: Function,
    visitedEntities: Record<string, any>,
  ): Record<
    string,
    Choices extends EntityMap ? UnionResult<Choices> : Normalize<Choices>
  >;

  _normalizeNullable():
    | Record<
        string,
        Choices extends EntityMap
          ? UnionResult<Choices>
          : NormalizeNullable<Choices>
      >
    | undefined;

  denormalize(
    input: any,
    unvisit: UnvisitFunction,
  ): [
    Record<
      string,
      Choices extends EntityMap<infer T> ? T : Denormalize<Choices>
    >,
    boolean,
  ];

  _denormalizeNullable(): [
    Record<
      string,
      Choices extends EntityMap<infer T>
        ? T | undefined
        : DenormalizeNullable<Choices>
    >,
    false,
  ];
}
