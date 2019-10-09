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
    private _identifier: 'Entity';
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

  export class Union<Choices extends EntityMap = any> {
    private _identifier: 'Union';
    constructor(
      definition: Choices,
      schemaAttribute:
        | (Choices[keyof Choices] extends Entity<infer T> ? keyof T : never)
        | SchemaFunction<keyof Choices>,
    );
    define(definition: Schema): void;
    inferSchema: SchemaAttributeFunction<Choices[keyof Choices]>;
    getSchemaAttribute: SchemaFunction<keyof Choices>;
    readonly schema: Choices;
  }

  export class Values<Choices extends EntityMap | Schema = any> {
    private _identifier: 'Values';
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
  | schemas.Union<schemas.EntityMap<T>>
  | schemas.Values<schemas.Entity<T> | SchemaObjectOne<T>>
  | SchemaObjectOne<T>;

export type SchemaList<T> =
  | SchemaArray<T>
  | SchemaObjectMany<T>
  | schemas.Array<SchemaDetail<T>>;

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

export type DenormalizedCore<S> = S extends schemas.Entity<infer T>
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
  ? (Choices[keyof Choices] extends schemas.Entity<infer T> ? T : never) // TODO: typescript 3.7 make this recursive instead
  : S extends schemas.Object<any, infer O>
  ? { [K in keyof O]: O[K] extends Schema ? DenormalizedCore<O[K]> : O[K] }
  : S extends { [key: string]: any }
  ? { [K in keyof S]: S[K] extends Schema ? DenormalizedCore<S[K]> : S[K] }
  : S;

type UnionResult<Choices extends schemas.EntityMap> = {
  id: ReturnType<Choices[keyof Choices]['getId']>;
  schema: keyof Choices;
};

export type Denormalized<S> = Extract<S, schemas.Entity<any>> extends never
  ? (S extends (infer I)[] | schemas.Array<infer I>
      ? DenormalizedCore<Extract<I, schemas.Entity<any>>>[]
      : DenormalizedCore<S>)
  : DenormalizedCore<Extract<S, schemas.Entity<any>>>;

export type ResultTypeCore<S> = S extends schemas.Entity<any>
  ? ReturnType<S['getId']> // should always be string
  : S extends schemas.Values<infer Choices>
  ? Record<
      string,
      Choices extends schemas.EntityMap
        ? UnionResult<Choices>
        : Choices extends schemas.Entity<any>
        ? ReturnType<Choices['getId']> // TODO: typescript 3.7 let's us make this recursive
        : never
    >
  : S extends schemas.Union<infer Choices>
  ? UnionResult<Choices>
  : S extends schemas.Object<any, infer O>
  ? { [K in keyof O]: O[K] extends Schema ? ResultTypeCore<O[K]> : O[K] }
  : S extends { [key: string]: any }
  ? { [K in keyof S]: S[K] extends Schema ? ResultTypeCore<S[K]> : S[K] }
  : S;

export type ResultType<S> = Extract<S, schemas.Entity<any>> extends never
  ? (S extends (infer I)[] | schemas.Array<infer I>
      ? ResultTypeCore<Extract<I, schemas.Entity<any>>>[]
      : ResultTypeCore<S>)
  : ResultTypeCore<Extract<S, schemas.Entity<any>>>;
