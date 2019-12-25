declare namespace schema {
  export type StrategyFunction<T> = (value: any, parent: any, key: string) => T;
  export type SchemaFunction<K = string> = (value: any, parent: any, key: string) => K;
  export type MergeFunction = (entityA: any, entityB: any) => any;
  export type SchemaAttributeFunction<S extends Schema> = (value: any, parent: any, key: string) => S;
  export type EntityMap<T = any> = { [key: string]: Entity<T> };
  export type UnvisitFunction = (input: any, schema: any) => [any, boolean];
  export type UnionResult<Choices extends EntityMap> = {
    id: ReturnType<Choices[keyof Choices]['getId']>;
    schema: keyof Choices;
  };

  export interface SchemaClass {
    normalize(
      input: any,
      parent: any,
      key: any,
      visit: Function,
      addEntity: Function,
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<any, any>;
    // this is not an actual member, but is needed for the recursive NormalizeNullable<> type algo
    _normalizeNullable(
      input: any,
      parent: any,
      key: any,
      visit: Function,
      addEntity: Function,
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<any, any>;
    denormalize(input: any, unvisit: UnvisitFunction): [any, boolean];
    // this is not an actual member, but is needed for the recursive DenormalizeNullable<> type algo
    _denormalizeNullable(input: any, unvisit: UnvisitFunction): [any, boolean];
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
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<any, Normalize<S>[]>;
    _normalizeNullable(
      input: any,
      parent: any,
      key: any,
      visit: Function,
      addEntity: Function,
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<any, Normalize<S>[] | undefined>;
    denormalize(input: any, unvisit: UnvisitFunction): [Denormalize<S>[], boolean];
    _denormalizeNullable(input: any, unvisit: UnvisitFunction): [Denormalize<S>[] | undefined, false];
  }

  export interface EntityOptions<T = any, ID = string> {
    idAttribute?: string | SchemaFunction<ID>;
    mergeStrategy?: MergeFunction;
    processStrategy?: StrategyFunction<T>;
  }

  export class Entity<T = any, K extends string | symbol = string> implements SchemaClass {
    constructor(key: K, definition?: Schema, options?: EntityOptions<T, string>);
    define(definition: Schema): void;
    readonly key: K;
    getId: SchemaFunction;
    _processStrategy: StrategyFunction<T>;
    normalize(
      input: any,
      parent: any,
      key: any,
      visit: Function,
      addEntity: Function,
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<any, string>; // string is the ReturnType of 'getId'
    _normalizeNullable(
      input: any,
      parent: any,
      key: any,
      visit: Function,
      addEntity: Function,
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<any, string | undefined>; // string is the ReturnType of 'getId'
    denormalize(input: any, unvisit: UnvisitFunction): [T, boolean];
    _denormalizeNullable(input: any, unvisit: UnvisitFunction): [T | undefined, boolean];
  }

  export class Object<O extends { [key: string]: any } = { [key: string]: Schema }> implements SchemaClass {
    constructor(definition: O);
    define(definition: Schema): void;
    readonly schema: O;
    normalize(
      input: any,
      parent: any,
      key: any,
      visit: Function,
      addEntity: Function,
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<any, NormalizeObject<O>>;
    _normalizeNullable(
      input: any,
      parent: any,
      key: any,
      visit: Function,
      addEntity: Function,
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<any, NormalizedNullableObject<O>>;
    denormalize(input: any, unvisit: UnvisitFunction): [DenormalizeObject<O>, boolean];
    _denormalizeNullable(input: any, unvisit: UnvisitFunction): [DenormalizeNullableObject<O>, false];
  }

  export class Union<Choices extends EntityMap = any> implements SchemaClass {
    constructor(
      definition: Choices,
      schemaAttribute:
        | (Choices[keyof Choices] extends Entity<infer T> ? keyof T : never)
        | SchemaFunction<keyof Choices>
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
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<any, UnionResult<Choices>>;
    _normalizeNullable(
      input: any,
      parent: any,
      key: any,
      visit: Function,
      addEntity: Function,
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<any, UnionResult<Choices> | undefined>;
    denormalize(
      input: any,
      unvisit: UnvisitFunction
    ): [Choices[keyof Choices] extends Entity<infer T> ? T : never, boolean];
    _denormalizeNullable(
      input: any,
      unvisit: UnvisitFunction
    ): [Choices[keyof Choices] extends Entity<infer T> ? T | undefined : never, false];
  }

  export class Values<Choices extends Schema = any> implements SchemaClass {
    constructor(
      definition: Choices,
      schemaAttribute?: Choices extends EntityMap<infer T> ? keyof T | SchemaFunction<keyof Choices> : undefined
    );
    define(definition: Schema): void;
    readonly isSingleSchema: Choices extends EntityMap ? false : true;
    inferSchema: SchemaAttributeFunction<Choices extends EntityMap ? Choices[keyof Choices] : Choices>;
    getSchemaAttribute: Choices extends EntityMap ? SchemaFunction<keyof Choices> : false;
    readonly schema: Choices;
    normalize(
      input: any,
      parent: any,
      key: any,
      visit: Function,
      addEntity: Function,
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<any, Record<string, Choices extends EntityMap ? UnionResult<Choices> : Normalize<Choices>>>;
    _normalizeNullable(
      input: any,
      parent: any,
      key: any,
      visit: Function,
      addEntity: Function,
      visitedEntities: { [key: string]: any }
    ): NormalizedSchema<
      any,
      Record<string, Choices extends EntityMap ? UnionResult<Choices> : NormalizeNullable<Choices>> | undefined
    >;
    denormalize(
      input: any,
      unvisit: UnvisitFunction
    ): [Record<string, Choices extends EntityMap<infer T> ? T : Denormalize<Choices>>, boolean];
    _denormalizeNullable(
      input: any,
      unvisit: UnvisitFunction
    ): [Record<string, Choices extends EntityMap<infer T> ? T | undefined : DenormalizeNullable<Choices>>, false];
  }
}

type DenormalizeObject<S extends { [key: string]: any }> = {
  [K in keyof S]: S[K] extends Schema ? Denormalize<S[K]> : S[K];
};

type DenormalizeNullableObject<S extends { [key: string]: any }> = {
  [K in keyof S]: S[K] extends Schema ? DenormalizeNullable<S[K]> : S[K];
};

type NormalizeObject<S extends { [key: string]: any }> = {
  [K in keyof S]: S[K] extends Schema ? Normalize<S[K]> : S[K];
};

type NormalizedNullableObject<S extends { [key: string]: any }> = {
  [K in keyof S]: S[K] extends Schema ? NormalizeNullable<S[K]> : S[K];
};

export type DenormalizeReturnType<T> = T extends (input: any, unvisit: any) => [infer R, any] ? R : never;
export type NormalizeReturnType<T> = T extends (...args: any) => NormalizedSchema<any, infer R> ? R : never;

// interfaces prevent infinite recursion since they eval lazily
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ArrayDenorm<F> extends Array<Denormalize<F>> {}

export type Denormalize<S> = S extends schema.SchemaClass
  ? DenormalizeReturnType<S['denormalize']>
  : S extends Array<infer F>
  ? ArrayDenorm<F>
  : S extends { [K: string]: any }
  ? DenormalizeObject<S>
  : S;

export type DenormalizeNullable<S> = S extends schema.SchemaClass
  ? DenormalizeReturnType<S['_denormalizeNullable']>
  : S extends Array<infer F>
  ? ArrayDenorm<F> | undefined
  : S extends { [K: string]: any }
  ? DenormalizeNullableObject<S>
  : S;

// interfaces prevent infinite recursion since they eval lazily
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ArrayNorm<F> extends Array<Normalize<F>> {}

export type Normalize<S> = S extends schema.SchemaClass
  ? NormalizeReturnType<S['normalize']>
  : S extends Array<infer F>
  ? ArrayNorm<F>
  : S extends { [K: string]: any }
  ? NormalizeObject<S>
  : S;

export type NormalizeNullable<S> = S extends schema.SchemaClass
  ? NormalizeReturnType<S['_normalizeNullable']>
  : S extends Array<infer F>
  ? ArrayNorm<F> | undefined
  : S extends { [K: string]: any }
  ? NormalizedNullableObject<S>
  : S;

// interfaces prevent infinite recursion since they eval lazily
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SchemaArray extends Array<Schema> {}

export type Schema = { [K: string]: any } | SchemaArray | schema.SchemaClass;

export type NormalizedSchema<E, R> = { entities: E; result: R };

export function normalize<
  S extends Schema = Schema,
  E extends { [key: string]: { [key: string]: any } } = { [key: string]: { [key: string]: any } },
  R = NormalizeNullable<S>
>(data: any, schema: S): NormalizedSchema<E, R>;

export function denormalize<S extends Schema>(
  input: any,
  schema: S,
  entities: any
): [Denormalize<S>, true] | [DenormalizeNullable<S>, false];
