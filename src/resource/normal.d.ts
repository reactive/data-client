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

  export class Union<T> {
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

export type Schema<T = any> = SchemaArray<T> | SchemaBase<T>;

export type SchemaArray<T = any> =
  | schemas.Array<T>[]
  | schemas.Entity<T>[]
  | schemas.Object<T>[]
  | schemas.Union<T>[]
  | schemas.Values<T>[]
  | { [key: string]: SchemaArray<T> };
export type SchemaBase<T = any> =
  | schemas.Array<T>
  | schemas.Entity<T>
  | schemas.Object<T>
  | schemas.Union<T>
  | schemas.Values<T>
  | { [key: string]: SchemaBase<T> };

export function normalize<T>(
  data: any,
  schema: Schema<T>,
): {
  entities: { [key: string]: { [key: string]: T } };
  result: any;
};

export function denormalize(input: any, schema: Schema, entities: any): any;
