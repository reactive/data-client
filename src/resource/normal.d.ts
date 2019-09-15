declare namespace schemas {
  export type StrategyFunction<T> = (value: any, parent: any, key: string) => T;
  export type SchemaFunction<T = string> = (
    value: any,
    parent: any,
    key: string,
  ) => T;
  export type MergeFunction = (entityA: any, entityB: any) => any;
  export type SchemaAttributeFunction<S extends Schema> = (
    value: any,
    parent: any,
    key: string,
  ) => S;
  type EntityMap<T = any> = { [key: string]: Entity<T> };

  export class Array<T = any> {
    constructor(
      definition: Schema<T>,
      schemaAttribute?: string | SchemaFunction,
    );
    define(definition: Schema): void;
  }

  export interface EntityOptions<T = any> {
    idAttribute?: string | SchemaFunction;
    mergeStrategy?: MergeFunction;
    processStrategy?: StrategyFunction<T>;
  }

  export class Entity<T = any> {
    constructor(key: string, definition?: Schema, options?: EntityOptions<T>);
    define(definition: Schema): void;
    key: string;
    getId: SchemaFunction;
    _processStrategy: StrategyFunction<T>;
  }

  export class Object<
    T = any,
    O extends { [key: string]: Schema<T> } = { [key: string]: Schema<T> }
  > {
    constructor(definition: O);
    define(definition: Schema): void;
  }

  export class Union<Choices extends EntityMap = any> {
    constructor(
      definition: Choices,
      schemaAttribute:
        | (Choices[keyof Choices] extends Entity<infer T> ? keyof T : never)
        | SchemaFunction<keyof Choices>,
    );
    define(definition: Schema): void;
    inferSchema: SchemaAttributeFunction<Choices[keyof Choices]>;
    getSchemaAttribute: SchemaFunction<keyof Choices>;
  }

  export class Values<Choices extends EntityMap | Schema = any> {
    constructor(
      definition: Choices,
      schemaAttribute?: Choices extends EntityMap<infer T>
        ? keyof T | SchemaFunction<keyof Choices>
        : undefined,
    );
    define(definition: Schema): void;
    isSingleSchema: Choices extends EntityMap ? false : true;
    inferSchema: SchemaAttributeFunction<
      Choices extends EntityMap ? Choices[keyof Choices] : Choices
    >;
    getSchemaAttribute: Choices extends EntityMap
      ? SchemaFunction<keyof Choices>
      : false;
  }
}

interface SimpleObject {
  [key: string]: SimpleObject | string | number | boolean;
}

interface SchemaObjectOne<T> {
  [key: string]:
    | SchemaDetail<T>
    | string
    | number
    | boolean
    | SimpleObject
    | void;
}

interface SchemaObjectMany<T> {
  [key: string]:
    | SchemaList<T>
    | string
    | number
    | boolean
    | SimpleObject
    | void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SchemaArray<T> extends Array<SchemaDetail<T>> {}

export type SchemaDetail<T> =
  | schemas.Entity<T>
  | schemas.Object<T>
  | schemas.Union<{ [key: string]: schemas.Entity<T> }>
  | schemas.Values<{ [key: string]: schemas.Entity<T> } | schemas.Entity<T>>
  | SchemaObjectOne<T>;

export type SchemaList<T> = SchemaArray<T> | SchemaObjectMany<T>;

export type Schema<T = any> = SchemaDetail<T> | SchemaList<T>;

export interface NormalizedSchema<E, R> {
  entities: E;
  result: R;
}

export function normalize<
  T = any,
  E = { [key: string]: { [key: string]: T } },
  R = any
>(data: any, schema: Schema<T>): NormalizedSchema<E, R>;

export function denormalize<S extends Schema>(
  input: ResultType<S>,
  schema: Schema,
  entities: any,
): Denormalized<S>;

export type Denormalized<S> = S extends schemas.Entity<infer T>
  ? T
  : S extends schemas.Values<infer Choices>
  ? Record<
      string,
      Choices extends schemas.EntityMap<infer T>
        ? T
        : Choices extends Schema<infer T>
        ? T
        : never
    >
  : S extends schemas.Union<infer Choices>
  ? // TODO: typescript 3.7 make this recursive instead
    (Choices[keyof Choices] extends schemas.Entity<infer T> ? T : never)
  : S extends schemas.Object<any, infer O>
  ? { [K in keyof O]: O[K] extends Schema ? Denormalized<O[K]> : O[K] }
  : S extends { [key: string]: any }
  ? { [K in keyof S]: S[K] extends Schema ? Denormalized<S[K]> : S[K] }
  : S;

type UnionResult<Choices extends schemas.EntityMap> = {
  id: ReturnType<Choices[keyof Choices]['getId']>;
  schema: keyof Choices;
};

export type ResultType<S> = S extends schemas.Entity
  ? ReturnType<S['getId']>
  : S extends schemas.Values<infer Choices>
  ? Record<
      string,
      Choices extends schemas.EntityMap
        ? UnionResult<Choices>
        : Choices extends schemas.Entity
        ? ReturnType<Choices['getId']>
        : // TODO: typescript 3.7 let's us make this recursive
          never
    >
  : S extends schemas.Union<infer Choices>
  ? UnionResult<Choices>
  : S extends schemas.Object<any, infer O>
  ? { [K in keyof O]: O[K] extends Schema ? ResultType<O[K]> : O[K] }
  : S extends { [key: string]: any }
  ? { [K in keyof S]: S[K] extends Schema ? ResultType<S[K]> : S[K] }
  : S;
