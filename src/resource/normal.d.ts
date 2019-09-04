declare namespace schemas {
  export type StrategyFunction<T> = (value: any, parent: any, key: string) => T;
  export type SchemaFunction = (value: any, parent: any, key: string) => string;
  export type MergeFunction = (entityA: any, entityB: any) => any;

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

  export class Object<T = any> {
    constructor(definition: { [key: string]: Schema<T> });
    define(definition: Schema): void;
  }

  export class Union<T = any> {
    constructor(
      definition: Schema<T>,
      schemaAttribute?: string | SchemaFunction,
    );
    define(definition: Schema): void;
  }

  export class Values<T = any> {
    constructor(
      definition: Schema<T>,
      schemaAttribute?: string | SchemaFunction,
    );
    define(definition: Schema): void;
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
  | schemas.Union<T>
  | schemas.Values<T>
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

// TODO: support Object, Union, Values, Array
export type Denormalized<S> = S extends schemas.Entity<infer T>
  ? T
  : S extends { [key: string]: any }
  ? { [K in keyof S]: S[K] extends Schema ? Denormalized<S[K]> : S[K] }
  : S;

export type ResultType<S> = S extends schemas.Entity
  ? ReturnType<S['getId']>
  : S extends { [key: string]: any }
  ? { [K in keyof S]: S[K] extends Schema ? ResultType<S[K]> : S[K] }
  : S;
