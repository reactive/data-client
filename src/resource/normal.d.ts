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
  [key: string]: SchemaOne<T> | string | number | boolean | SimpleObject | void;
}

interface SchemaObjectMany<T> {
  [key: string]:
    | SchemaMany<T>
    | string
    | number
    | boolean
    | SimpleObject
    | void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SchemaArray<T> extends Array<SchemaOne<T>> {}

export type SchemaOne<T> =
  | schemas.Entity<T>
  | schemas.Object<T>
  | schemas.Union<T>
  | schemas.Values<T>
  | SchemaObjectOne<T>;

export type SchemaMany<T> = SchemaArray<T> | SchemaObjectMany<T>;

export type Schema<T = any> = SchemaOne<T> | SchemaMany<T>;

export interface NormalizedSchema<E, R> {
  entities: E;
  result: R;
}

export function normalize<
  T = any,
  E = { [key: string]: { [key: string]: T } },
  R = any
>(data: any, schema: Schema<T>): NormalizedSchema<E, R>;

export function denormalize(input: any, schema: Schema, entities: any): any;
