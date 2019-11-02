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
  export type EntityMap<T = any> = { [key: string]: Entity<T> };

  export class Array<S extends Schema = Schema<any>> {
    private _identifier: 'Array';
    constructor(definition: S, schemaAttribute?: string | SchemaFunction);
    define(definition: Schema): void;
    readonly schema: S;
  }

  export interface EntityOptions<T = any, ID = string> {
    idAttribute?: string | SchemaFunction<ID>;
    mergeStrategy?: MergeFunction;
    processStrategy?: StrategyFunction<T>;
  }

  export class Entity<T = any, K extends string = string> {
    constructor(
      key: K,
      definition?: Schema,
      options?: EntityOptions<T, string>,
    );
    define(definition: Schema): void;
    readonly key: K;
    getId: SchemaFunction<string>;
    _processStrategy: StrategyFunction<T>;
  }

  export class Object<
    T = any,
    O extends { [key: string]: Schema<T> } = { [key: string]: Schema<T> }
  > {
    constructor(definition: O);
    define(definition: Schema): void;
    readonly schema: O;
  }

  export class Union<T = any, Choices extends EntityMap<T> = any> {
    constructor(
      definition: Choices,
      schemaAttribute:
        | (Choices[keyof Choices] extends Entity<infer T> ? keyof T : never)
        | SchemaFunction<keyof Choices>,
    );
    define(definition: Schema): void;
    readonly schema: Choices;
  }

  export class Values<T = any, Choices extends EntityMap<T> | Schema<T> = any> {
    constructor(
      definition: Choices,
      schemaAttribute?: Choices extends EntityMap<infer T>
        ? keyof T | SchemaFunction<keyof Choices>
        : undefined,
    );
    define(definition: Schema): void;
    readonly schema: Choices;
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
  | schemas.Values<T, schemas.Entity<T> | SchemaObjectOne<T>>
  | SchemaObjectOne<T>;

export type SchemaList<T> =
  | SchemaArray<T>
  | SchemaObjectMany<T>
  | schemas.Array<SchemaDetail<T>>;

export type Schema<T = any> = SchemaDetail<T> | SchemaList<T>;
