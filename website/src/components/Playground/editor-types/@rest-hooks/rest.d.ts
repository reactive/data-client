declare type AbstractInstanceType<T> = T extends {
  prototype: infer U;
}
  ? U
  : never;
declare type DenormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Denormalize<S[K]> : S[K];
};
declare type DenormalizeNullableObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? DenormalizeNullable<S[K]> : S[K];
};
declare type NormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Normalize<S[K]> : S[K];
};
declare type NormalizedNullableObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? NormalizeNullable<S[K]> : S[K];
};
interface NestedSchemaClass<T = any> {
  schema: Record<string, Schema>;
  prototype: T;
}
interface RecordClass<T = any> extends NestedSchemaClass<T> {
  fromJS: (...args: any) => AbstractInstanceType<T>;
}
declare type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> =
  keyof S['schema'] extends never
    ? S['prototype']
    : string extends keyof S['schema']
    ? S['prototype']
    : S['prototype'] & {
        [K in keyof S['schema']]: DenormalizeNullable<S['schema'][K]>;
      };
declare type DenormalizeReturnType<T> = T extends (
  input: any,
  unvisit: any,
) => [infer R, any, any]
  ? R
  : never;
declare type NormalizeReturnType<T> = T extends (...args: any) => infer R
  ? R
  : never;
declare type Denormalize<S> = S extends EntityInterface<infer U>
  ? U
  : S extends RecordClass
  ? AbstractInstanceType<S>
  : S extends SchemaClass
  ? DenormalizeReturnType<S['denormalize']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Denormalize<F>[]
  : S extends {
      [K: string]: any;
    }
  ? DenormalizeObject<S>
  : S;
declare type DenormalizeNullable<S> = S extends EntityInterface<any>
  ? DenormalizeNullableNestedSchema<S> | undefined
  : S extends RecordClass
  ? DenormalizeNullableNestedSchema<S>
  : S extends SchemaClass
  ? DenormalizeReturnType<S['_denormalizeNullable']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Denormalize<F>[] | undefined
  : S extends {
      [K: string]: any;
    }
  ? DenormalizeNullableObject<S>
  : S;
declare type Normalize<S> = S extends EntityInterface
  ? string
  : S extends RecordClass
  ? NormalizeObject<S['schema']>
  : S extends SchemaClass
  ? NormalizeReturnType<S['normalize']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Normalize<F>[]
  : S extends {
      [K: string]: any;
    }
  ? NormalizeObject<S>
  : S;
declare type NormalizeNullable<S> = S extends EntityInterface
  ? string | undefined
  : S extends RecordClass
  ? NormalizedNullableObject<S['schema']>
  : S extends SchemaClass
  ? NormalizeReturnType<S['_normalizeNullable']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Normalize<F>[] | undefined
  : S extends {
      [K: string]: any;
    }
  ? NormalizedNullableObject<S>
  : S;
interface EntityMap<T = any> {
  readonly [k: string]: EntityInterface<T>;
}

/**
 * Marks entity as deleted.
 * @see https://resthooks.io/rest/api/Delete
 */
declare class Delete<
  E extends EntityInterface & {
    process: any;
  },
> implements SchemaClass$1
{
  private _entity;
  constructor(entity: E);
  get key(): string;
  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
  ): string | undefined;

  infer(args: any, indexes: any, recurse: any): any;
  denormalize(
    id: string,
    unvisit: UnvisitFunction,
  ): [denormalized: AbstractInstanceType<E>, found: boolean, suspend: boolean];

  _denormalizeNullable(): [AbstractInstanceType<E> | undefined, boolean, false];

  _normalizeNullable(): string | undefined;
  merge(existing: any, incoming: any): any;
  useIncoming(
    existingMeta: {
      date: number;
      fetchedAt: number;
    },
    incomingMeta: {
      date: number;
      fetchedAt: number;
    },
    existing: any,
    incoming: any,
  ): boolean;
}

/**
 * Represents arrays
 * @see https://resthooks.io/rest/api/Array
 */
declare class Array$1<S extends Schema = Schema> implements SchemaClass$1 {
  constructor(
    definition: S,
    schemaAttribute?: S extends EntityMap<infer T>
      ? keyof T | SchemaFunction<keyof S>
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
  ): (S extends EntityMap ? UnionResult<S> : Normalize<S>)[];

  _normalizeNullable():
    | (S extends EntityMap ? UnionResult<S> : Normalize<S>)[]
    | undefined;

  denormalize(
    // eslint-disable-next-line @typescript-eslint/ban-types
    input: {},
    unvisit: UnvisitFunction,
  ): [
    denormalized: (S extends EntityMap<infer T> ? T : Denormalize<S>)[],
    found: boolean,
    suspend: boolean,
  ];

  _denormalizeNullable(): [
    (S extends EntityMap<infer T> ? T : Denormalize<S>)[] | undefined,
    false,
    boolean,
  ];

  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
  ): any;
}

/**
 * Retrieves all entities in cache
 *
 * @see https://resthooks.io/rest/api/AllSchema
 */
declare class All<
  S extends EntityMap | EntityInterface = EntityMap | EntityInterface,
> implements SchemaClass$1
{
  constructor(
    definition: S,
    schemaAttribute?: S extends EntityMap<infer T>
      ? keyof T | SchemaFunction<keyof S>
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
  ): (S extends EntityMap ? UnionResult<S> : Normalize<S>)[];

  _normalizeNullable():
    | (S extends EntityMap ? UnionResult<S> : Normalize<S>)[]
    | undefined;

  denormalize(
    // eslint-disable-next-line @typescript-eslint/ban-types
    input: {},
    unvisit: UnvisitFunction,
  ): [
    denormalized: (S extends EntityMap<infer T> ? T : Denormalize<S>)[],
    found: boolean,
    suspend: boolean,
  ];

  _denormalizeNullable(): [
    (S extends EntityMap<infer T> ? T : Denormalize<S>)[] | undefined,
    false,
    boolean,
  ];

  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
    entities: EntityTable,
  ): any;
}

/**
 * Represents objects with statically known members
 * @see https://resthooks.io/rest/api/Object
 */
declare class Object$1<O extends Record<string, any> = Record<string, Schema>>
  implements SchemaClass$1
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
  ): NormalizeObject<O>;

  _normalizeNullable(): NormalizedNullableObject<O>;

  denormalize(
    // eslint-disable-next-line @typescript-eslint/ban-types
    input: {},
    unvisit: UnvisitFunction,
  ): [denormalized: DenormalizeObject<O>, found: boolean, suspend: boolean];

  _denormalizeNullable(): [DenormalizeNullableObject<O>, false, boolean];

  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
  ): any;
}

/**
 * Represents polymorphic values.
 * @see https://resthooks.io/rest/api/Union
 */
declare class Union<Choices extends EntityMap = any> implements SchemaClass$1 {
  constructor(
    definition: Choices,
    schemaAttribute:
      | keyof AbstractInstanceType<Choices[keyof Choices]>
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
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
  ): UnionResult<Choices>;

  _normalizeNullable(): UnionResult<Choices> | undefined;

  denormalize(
    // eslint-disable-next-line @typescript-eslint/ban-types
    input: {},
    unvisit: UnvisitFunction,
  ): [
    denormalized: AbstractInstanceType<Choices[keyof Choices]>,
    found: boolean,
    suspend: boolean,
  ];

  _denormalizeNullable(): [
    AbstractInstanceType<Choices[keyof Choices]> | undefined,
    false,
    boolean,
  ];

  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
  ): any;
}

/**
 * Represents variably sized objects
 * @see https://resthooks.io/rest/api/Values
 */
declare class Values<Choices extends Schema = any> implements SchemaClass$1 {
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
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
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
    // eslint-disable-next-line @typescript-eslint/ban-types
    input: {},
    unvisit: UnvisitFunction,
  ): [
    denormalized: Record<
      string,
      Choices extends EntityMap<infer T> ? T : Denormalize<Choices>
    >,
    found: boolean,
    suspend: boolean,
  ];

  _denormalizeNullable(): [
    Record<
      string,
      Choices extends EntityMap<infer T>
        ? T | undefined
        : DenormalizeNullable<Choices>
    >,
    false,
    boolean,
  ];

  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
  ): any;
}

type StrategyFunction<T> = (value: any, parent: any, key: string) => T;
type SchemaFunction<K = string> = (value: any, parent: any, key: string) => K;
type MergeFunction = (entityA: any, entityB: any) => any;
type SchemaAttributeFunction<S extends Schema> = (
  value: any,
  parent: any,
  key: string,
) => S;

type UnionResult<Choices extends EntityMap> = {
  id: string;
  schema: keyof Choices;
};
interface SchemaClass$1<T = any, N = T | undefined> extends SchemaSimple<T> {
  // this is not an actual member, but is needed for the recursive NormalizeNullable<> type algo
  _normalizeNullable(): any;
  // this is not an actual member, but is needed for the recursive DenormalizeNullable<> type algo
  _denormalizeNullable(): [N, boolean, boolean];
}

type schema_d_Delete<
  E extends EntityInterface & {
    process: any;
  },
> = Delete<E>;
declare const schema_d_Delete: typeof Delete;
type schema_d_EntityMap<T = any> = EntityMap<T>;
type schema_d_UnvisitFunction = UnvisitFunction;
type schema_d_All<
  S extends EntityMap | EntityInterface = EntityMap | EntityInterface,
> = All<S>;
declare const schema_d_All: typeof All;
type schema_d_Union<Choices extends EntityMap = any> = Union<Choices>;
declare const schema_d_Union: typeof Union;
type schema_d_Values<Choices extends Schema = any> = Values<Choices>;
declare const schema_d_Values: typeof Values;
type schema_d_StrategyFunction<T> = StrategyFunction<T>;
type schema_d_SchemaFunction<K = string> = SchemaFunction<K>;
type schema_d_MergeFunction = MergeFunction;
type schema_d_SchemaAttributeFunction<S extends Schema> =
  SchemaAttributeFunction<S>;
type schema_d_UnionResult<Choices extends EntityMap> = UnionResult<Choices>;
type schema_d_EntityInterface<T = any> = EntityInterface<T>;
declare namespace schema_d {
  export {
    schema_d_Delete as Delete,
    schema_d_EntityMap as EntityMap,
    schema_d_UnvisitFunction as UnvisitFunction,
    Array$1 as Array,
    schema_d_All as All,
    Object$1 as Object,
    schema_d_Union as Union,
    schema_d_Values as Values,
    schema_d_StrategyFunction as StrategyFunction,
    schema_d_SchemaFunction as SchemaFunction,
    schema_d_MergeFunction as MergeFunction,
    schema_d_SchemaAttributeFunction as SchemaAttributeFunction,
    schema_d_UnionResult as UnionResult,
    SchemaClass$1 as SchemaClass,
    schema_d_EntityInterface as EntityInterface,
  };
}

/** Get the Params type for a given Shape */
declare type EndpointParam<E> = E extends (first: infer A, ...rest: any) => any
  ? A
  : E extends {
      key: (first: infer A, ...rest: any) => any;
    }
  ? A
  : never;
/** What the function's promise resolves to */
declare type ResolveType<E extends (...args: any) => any> =
  ReturnType<E> extends Promise<infer R> ? R : never;
declare type PartialArray<A> = A extends []
  ? []
  : A extends [infer F]
  ? [F] | []
  : A extends [infer F, ...infer Rest]
  ? [F] | [F, ...PartialArray<Rest>]
  : A extends (infer T)[]
  ? T[]
  : never;

interface NetworkError$1 extends Error {
  status: number;
  response?: Response;
}
interface UnknownError extends Error {
  status?: unknown;
  response?: unknown;
}
declare type ErrorTypes = NetworkError$1 | UnknownError;

interface SnapshotInterface {
  getResponse: <
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
    Args extends readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...args: Args
  ) => {
    data: DenormalizeNullable<E['schema']>;
    expiryStatus: ExpiryStatusInterface;
    expiresAt: number;
  };
  getError: <
    E extends Pick<EndpointInterface, 'key'>,
    Args extends readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...args: Args
  ) => ErrorTypes | undefined;
  readonly fetchedAt: number;
}
declare type ExpiryStatusInterface = 1 | 2 | 3;

declare type FetchFunction<A extends readonly any[] = any, R = any> = (
  ...args: A
) => Promise<R>;
/** @deprecated */
declare type SchemaDetail<T> =
  | EntityInterface<T>
  | {
      [K: string]: any;
    }
  | SchemaClass$1;
/** @deprecated */
declare type SchemaList<T> =
  | EntityInterface<T>[]
  | {
      [K: string]: any;
    }
  | Schema[]
  | SchemaClass$1;
interface EndpointExtraOptions<F extends FetchFunction = FetchFunction> {
  /** Default data expiry length, will fall back to NetworkManager default if not defined */
  readonly dataExpiryLength?: number;
  /** Default error expiry length, will fall back to NetworkManager default if not defined */
  readonly errorExpiryLength?: number;
  /** Poll with at least this frequency in miliseconds */
  readonly pollFrequency?: number;
  /** Marks cached resources as invalid if they are stale */
  readonly invalidIfStale?: boolean;
  /** Enables optimistic updates for this request - uses return value as assumed network response
   * @deprecated use https://resthooks.io/docs/api/Endpoint#getoptimisticresponse instead
   */
  optimisticUpdate?(...args: Parameters<F>): ResolveType<F>;
  /** Enables optimistic updates for this request - uses return value as assumed network response */
  getOptimisticResponse?(
    snap: SnapshotInterface,
    ...args: Parameters<F>
  ): ResolveType<F>;
  /** Determines whether to throw or fallback to */
  errorPolicy?(error: any): 'hard' | 'soft' | undefined;
  /** User-land extra data to send */
  readonly extra?: any;
}

declare type Schema =
  | null
  | string
  | {
      [K: string]: any;
    }
  | Schema[]
  | SchemaSimple
  | Serializable;
declare type Serializable<
  T extends {
    toJSON(): string;
  } = {
    toJSON(): string;
  },
> = {
  prototype: T;
};
interface SchemaSimple<T = any> {
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
  ): any;
  denormalize(
    input: {},
    unvisit: UnvisitFunction,
  ): [denormalized: T, found: boolean, suspend: boolean];
  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
    entities: EntityTable,
  ): any;
}
interface SchemaClass<T = any, N = T | undefined> extends SchemaSimple<T> {
  _normalizeNullable(): any;
  _denormalizeNullable(): [N, boolean, boolean];
}
interface EntityInterface<T = any> extends SchemaSimple {
  pk(params: any, parent?: any, key?: string): string | undefined;
  readonly key: string;
  merge(existing: any, incoming: any): any;
  expiresAt?(meta: any, input: any): number;
  useIncoming?(
    existingMeta: any,
    incomingMeta: any,
    existing: any,
    incoming: any,
  ): boolean;
  indexes?: any;
  schema: Record<string, Schema>;
  prototype: T;
}
interface UnvisitFunction {
  (input: any, schema: any): [any, boolean, boolean];
  og?: UnvisitFunction;
  setLocal?: (entity: any) => void;
}
interface NormalizedIndex {
  readonly [entityKey: string]: {
    readonly [indexName: string]: {
      readonly [lookup: string]: string;
    };
  };
}
interface EntityTable {
  [entityKey: string]:
    | {
        [pk: string]: unknown;
      }
    | undefined;
}
/** Defines a networking endpoint */
interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointExtraOptions<F> {
  (...args: Parameters<F>): ReturnType<F>;
  key(...args: Parameters<F>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}
/** For retrieval requests */
declare type ReadEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
> = EndpointInterface<F, S, undefined>;

/* eslint-disable @typescript-eslint/ban-types */

interface EndpointOptions<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = undefined,
  M extends true | undefined = undefined,
> extends EndpointExtraOptions<F> {
  key?: (...args: Parameters<F>) => string;
  sideEffect?: M;
  schema?: S;
  [k: string]: any;
}

interface EndpointExtendOptions<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointOptions<F, S, M> {
  fetch?: FetchFunction;
}

type KeyofEndpointInstance = keyof EndpointInstance<FetchFunction>;

type ExtendedEndpoint<
  O extends EndpointExtendOptions<F>,
  E extends EndpointInstance<
    FetchFunction,
    Schema | undefined,
    true | undefined
  >,
  F extends FetchFunction,
> = EndpointInstance<
  'fetch' extends keyof O ? Exclude<O['fetch'], undefined> : E['fetch'],
  'schema' extends keyof O ? O['schema'] : E['schema'],
  'sideEffect' extends keyof O ? O['sideEffect'] : E['sideEffect']
> &
  Omit<O, KeyofEndpointInstance> &
  Omit<E, KeyofEndpointInstance>;

/**
 * Defines an async data source.
 * @see https://resthooks.io/docs/api/Endpoint
 */
interface EndpointInstance<
  F extends (...args: any) => Promise<any> = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointInstanceInterface<F, S, M> {
  extend<
    E extends EndpointInstance<
      (...args: any) => Promise<any>,
      Schema | undefined,
      true | undefined
    >,
    O extends EndpointExtendOptions<F> &
      Partial<Omit<E, keyof EndpointInstance<FetchFunction>>> &
      Record<string, unknown>,
  >(
    this: E,
    options: Readonly<O>,
  ): ExtendedEndpoint<typeof options, E, F>;
}

/**
 * Defines an async data source.
 * @see https://resthooks.io/docs/api/Endpoint
 */
interface EndpointInstanceInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointInterface<F, S, M> {
  constructor: EndpointConstructor;

  /**
   * Calls the function, substituting the specified object for the this value of the function, and the specified array for the arguments of the function.
   * @param thisArg The object to be used as the this object.
   * @param argArray A set of arguments to be passed to the function.
   */
  apply<E extends FetchFunction>(
    this: E,
    thisArg: ThisParameterType<E>,
    argArray?: Parameters<E>,
  ): ReturnType<E>;

  /**
   * Calls a method of an object, substituting another object for the current object.
   * @param thisArg The object to be used as the current object.
   * @param argArray A list of arguments to be passed to the method.
   */
  call<E extends FetchFunction>(
    this: E,
    thisArg: ThisParameterType<E>,
    ...argArray: Parameters<E>
  ): ReturnType<E>;

  /**
   * For a given function, creates a bound function that has the same body as the original function.
   * The this object of the bound function is associated with the specified object, and has the specified initial parameters.
   * @param thisArg An object to which the this keyword can refer inside the new function.
   * @param argArray A list of arguments to be passed to the new function.
   */
  bind<E extends FetchFunction, P extends PartialArray<Parameters<E>>>(
    this: E,
    thisArg: ThisParameterType<E>,
    ...args: readonly [...P]
  ): EndpointInstance<
    (...args: readonly [...RemoveArray<Parameters<E>, P>]) => ReturnType<E>,
    S,
    M
  > &
    Omit<E, keyof EndpointInstance<FetchFunction>>;

  /** Returns a string representation of a function. */
  toString(): string;

  prototype: any;
  readonly length: number;

  // Non-standard extensions
  arguments: any;
  caller: F;

  key(...args: Parameters<F>): string;

  readonly sideEffect: M;

  readonly schema: S;

  fetch: F;

  /** The following is for compatibility with FetchShape */
  /** @deprecated */
  readonly type: M extends undefined
    ? 'read'
    : IfAny<M, any, IfTypeScriptLooseNull<'read', 'mutate'>>;

  /** @deprecated */
  getFetchKey(...args: OnlyFirst<Parameters<F>>): string;
  /** @deprecated */
  options?: EndpointExtraOptions<F>;
}

interface EndpointConstructor {
  new <
    F extends (
      this: EndpointInstance<FetchFunction> & E,
      params?: any,
      body?: any,
    ) => Promise<any>,
    S extends Schema | undefined = undefined,
    M extends true | undefined = undefined,
    E extends Record<string, any> = {},
  >(
    fetchFunction: F,
    options?: EndpointOptions<F, S, M> & E,
  ): EndpointInstance<F, S, M> & E;
  readonly prototype: Function;
}
declare let Endpoint: EndpointConstructor;

interface ExtendableEndpointConstructor {
  new <
    F extends (
      this: EndpointInstanceInterface<FetchFunction> & E,
      params?: any,
      body?: any,
    ) => Promise<any>,
    S extends Schema | undefined = undefined,
    M extends true | undefined = undefined,
    E extends Record<string, any> = {},
  >(
    RestFetch: F,
    options?: Readonly<EndpointOptions<F, S, M>> & E,
  ): EndpointInstanceInterface<F, S, M> & E;
  readonly prototype: Function;
}
declare let ExtendableEndpoint: ExtendableEndpointConstructor;

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
type IfTypeScriptLooseNull<Y, N> = 1 | undefined extends 1 ? Y : N;

type OnlyFirst<A extends unknown[]> = A extends [] ? [] : [A[0]];

type RemoveArray<Orig extends any[], Rem extends any[]> = Rem extends [
  any,
  ...infer RestRem,
]
  ? Orig extends [any, ...infer RestOrig]
    ? RemoveArray<RestOrig, RestRem>
    : never
  : Orig;

/**
 * Represents data that should be deduped by specifying a primary key.
 * @see https://resthooks.io/docs/api/Entity
 */
declare abstract class Entity {
  static toJSON(): {
    name: string;
    schema: {
      [k: string]: Schema;
    };
    key: string;
  };

  /** Defines nested entities */
  static schema: {
    [k: string]: Schema;
  };

  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  abstract pk(parent?: any, key?: string): string | undefined;
  /** Returns the globally unique identifier for the static Entity */
  static get key(): string;
  /** Defines indexes to enable lookup by */
  static indexes?: readonly string[];
  /** Control how automatic schema validation is handled
   *
   * `undefined`: Defaults - throw error in worst offense
   * 'warn': only ever warn
   * 'silent': Don't bother with processing at all
   *
   * Note: this only applies to non-nested members.
   */
  protected static automaticValidation?: 'warn' | 'silent';
  /**
   * A unique identifier for each Entity
   *
   * @param [value] POJO of the entity or subset used
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  static pk<T extends typeof Entity>(
    this: T,
    value: Partial<AbstractInstanceType<T>>,
    parent?: any,
    key?: string,
  ): string | undefined;

  /** Return true to merge incoming data; false keeps existing entity */
  static useIncoming(
    existingMeta: {
      date: number;
      fetchedAt: number;
    },
    incomingMeta: {
      date: number;
      fetchedAt: number;
    },
    existing: any,
    incoming: any,
  ): boolean;

  /** Creates new instance copying over defined values of arguments */
  static merge(existing: any, incoming: any): any;
  /** Factory method to convert from Plain JS Objects.
   *
   * @param [props] Plain Object of properties to assign.
   * @param [parent] When normalizing, the object which included the record
   * @param [key] When normalizing, the key where this record was found
   */
  static fromJS<T extends typeof Entity>(
    this: T,
    props?: Partial<AbstractInstanceType<T>>,
  ): AbstractInstanceType<T>;

  /** Do any transformations when first receiving input */
  static process(input: any, parent: any, key: string | undefined): any;
  static normalize(
    input: any,
    parent: any,
    key: string | undefined,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
  ): any;

  protected static validate(processedEntity: any): string | undefined;
  static infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: any,
  ): any;

  static expiresAt(
    meta: {
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    input: any,
  ): number;

  static denormalize<T extends typeof Entity>(
    this: T,
    input: any,
    unvisit: UnvisitFunction,
  ): [denormalized: AbstractInstanceType<T>, found: boolean, suspend: boolean];

  private static __defaults;
  /** All instance defaults set */
  protected static get defaults(): any;
  /** Used by denormalize to set nested members */
  protected static set(entity: any, key: string, value: any): void;
}

declare function validateRequired(
  processedEntity: any,
  requiredDefaults: Record<string, unknown>,
): string | undefined;

declare const DELETED: unique symbol;

/**
 * Performant lookups by secondary indexes
 * @see https://resthooks.io/docs/api/Index
 */
declare class Index<S extends Schema, P = Readonly<IndexParams<S>>> {
  schema: S;
  constructor(schema: S, key?: (params: P) => string);
  key(params?: P): string;
  /** The following is for compatibility with FetchShape */
  getFetchKey: (params: P) => string;
}
declare type ArrayElement<ArrayType extends unknown[] | readonly unknown[]> =
  ArrayType[number];
declare type IndexParams<S extends Schema> = S extends {
  indexes: readonly string[];
}
  ? {
      [K in Extract<
        ArrayElement<S['indexes']>,
        keyof AbstractInstanceType<S>
      >]?: AbstractInstanceType<S>[K];
    }
  : Readonly<object>;

/**
 * Programmatic cache reading
 * @see https://resthooks.io/rest/api/Query
 */
declare class Query<S extends SchemaSimple, P extends any[] = []> {
  schema: S;
  process: (entries: Denormalize<S>, ...args: P) => Denormalize<S>;
  readonly sideEffect: undefined;
  constructor(
    schema: S,
    process?: (entries: Denormalize<S>, ...args: P) => Denormalize<S>,
  );

  key(...args: P): string;
  protected createQuerySchema(schema: SchemaSimple): any;
}

declare class AbortOptimistic extends Error {}

declare type OnlyOptional<S extends string> = S extends `${infer K}?`
  ? K
  : never;
declare type OnlyRequired<S extends string> = S extends `${string}?`
  ? never
  : S;
/** Computes the union of keys for a path string */
declare type PathKeys<S extends string> = string extends S
  ? string
  : S extends `${infer A}\\:${infer B}`
  ? PathKeys<A> | PathKeys<B>
  : S extends `${infer A}\\?${infer B}`
  ? PathKeys<A> | PathKeys<B>
  : PathSplits<S>;
declare type PathSplits<S extends string> =
  S extends `${string}:${infer K}/${infer R}`
    ? PathSplits<`:${K}`> | PathSplits<R>
    : S extends `${string}:${infer K}:${infer R}`
    ? PathSplits<`:${K}`> | PathSplits<`:${R}`>
    : S extends `${string}:${infer K}`
    ? K
    : never;
/** Parameters for a given path */
declare type PathArgs<S extends string> = PathKeys<S> extends never
  ? unknown
  : KeysToArgs<PathKeys<S>>;
declare type KeysToArgs<Key extends string> = {
  [K in Key as OnlyOptional<K>]?: string | number;
} & {
  [K in Key as OnlyRequired<K>]: string | number;
};
declare type PathArgsAndSearch<S extends string> = OnlyRequired<
  PathKeys<S>
> extends never
  ? Record<string, number | string | boolean> | undefined
  : {
      [K in PathKeys<S> as OnlyRequired<K>]: string | number;
    } & Record<string, number | string>;
/** Removes the last :token */
declare type ShortenPath<S extends string> = string extends S
  ? string
  : S extends `${infer B}:${infer R}`
  ? TrimColon<`${B}:${ShortenPath<R>}`>
  : '';
declare type TrimColon<S extends string> = string extends S
  ? string
  : S extends `${infer R}:`
  ? R
  : S;

/* eslint-disable @typescript-eslint/ban-types */

interface RestInstance<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = any,
  M extends true | undefined = true | undefined,
> extends EndpointInstanceInterface<F, S, M> {
  /** Pattern to construct url based on Url Parameters
   * @see https://resthooks.io/rest/api/RestEndpoint#path
   */
  readonly path: string;
  /** Prepended to all urls
   * @see https://resthooks.io/rest/api/RestEndpoint#urlPrefix
   */
  readonly urlPrefix: string;
  readonly requestInit: RequestInit;
  readonly method: string;
  readonly signal: AbortSignal | undefined;

  /* fetch lifecycles */
  /* before-fetch */
  url(...args: Parameters<F>): string;
  /** @see https://resthooks.io/rest/api/RestEndpoint#getRequestInit */
  getRequestInit(
    this: any,
    body?: RequestInit['body'] | Record<string, unknown>,
  ): RequestInit;
  /** @see https://resthooks.io/rest/api/RestEndpoint#getHeaders */
  getHeaders(headers: HeadersInit): HeadersInit;
  /* after-fetch */
  /** @see https://resthooks.io/rest/api/RestEndpoint#fetchResponse */
  fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
  /** @see https://resthooks.io/rest/api/RestEndpoint#parseResponse */
  parseResponse(response: Response): Promise<any>;
  /** @see https://resthooks.io/rest/api/RestEndpoint#process */
  process(value: any, ...args: Parameters<F>): ResolveType<F>;

  /* extenders */
  paginated<
    E extends RestInstance<FetchFunction, Schema | undefined, undefined>,
    A extends any[],
  >(
    this: E,
    removeCursor: (...args: A) => readonly [...Parameters<E>],
  ): PaginationEndpoint<E, A>;
  extend<E extends RestInstance, O extends PartialRestGenerics | {}>(
    this: E,
    options: Readonly<RestEndpointExtendOptions<O, E, F> & O>,
  ): RestExtendedEndpoint<O, E>;
}

type RestEndpointExtendOptions<
  O extends PartialRestGenerics | {},
  E extends RestInstance,
  F extends FetchFunction,
> = RestEndpointOptions<OptionsToFunction<O, E, F>> &
  Partial<Omit<E, keyof RestInstance>>;

type OptionsToFunction<
  O extends PartialRestGenerics,
  E extends RestInstance,
  F extends FetchFunction,
> = 'path' extends keyof O
  ? RestType<
      'searchParams' extends keyof O
        ? O['searchParams'] & PathArgs<Exclude<O['path'], undefined>>
        : PathArgs<Exclude<O['path'], undefined>>,
      'body' extends keyof O ? O['body'] : undefined,
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>
    >
  : 'body' extends keyof O
  ? RestType<
      UrlParamsFromFunction<Parameters<E>>,
      O['body'],
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>
    >
  : F;
type UrlParamsFromFunction<Args extends any[]> = 1 extends keyof Args
  ? Args[0]
  : undefined;

type RestExtendedEndpoint<
  O extends PartialRestGenerics,
  E extends RestInstance,
> = OptionsToFunction<
  O,
  E,
  RestInstance<
    (
      ...args: Parameters<E>
    ) => O['process'] extends {}
      ? Promise<ReturnType<O['process']>>
      : ReturnType<E>,
    'schema' extends keyof O ? O['schema'] : E['schema'],
    'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect']
  >
> &
  Omit<O, KeyofRestEndpoint | 'body' | 'searchParams'> &
  Omit<E, KeyofRestEndpoint>;

interface PartialRestGenerics {
  readonly path?: string;
  readonly schema?: Schema | undefined;
  readonly method?: string;
  /** Only used for types */
  readonly body?: any;
  /** Only used for types */
  readonly searchParams?: any;
  /** @see https://resthooks.io/rest/api/RestEndpoint#process */
  process?(value: any, ...args: any): any;
}
interface RestGenerics extends PartialRestGenerics {
  readonly path: string;
}

type PaginationEndpoint<E extends RestInstance, A extends any[]> = RestInstance<
  ParamFetchNoBody<A[0], ResolveType<E>>,
  E['schema'],
  E['sideEffect']
>;

type BodyDefault<O extends RestGenerics> = 'body' extends keyof O
  ? O['body']
  : O['method'] extends 'POST' | 'PUT' | 'PATCH'
  ? Record<string, unknown> | FormData
  : undefined;

interface RestEndpointOptions<F extends FetchFunction = FetchFunction>
  extends EndpointExtraOptions<F> {
  fetch?: F;
  urlPrefix?: string;
  requestInit?: RequestInit;
  key?(...args: Parameters<F>): string;
  sideEffect?: true | undefined;
  name?: string;
  signal?: AbortSignal;
  url?(...args: Parameters<F>): string;
  getHeaders?(headers: HeadersInit): HeadersInit;
  getRequestInit?(body: any): RequestInit;
  fetchResponse?(input: RequestInfo, init: RequestInit): Promise<any>;
  parseResponse?(response: Response): Promise<any>;
  update?(...args: any): any;
}

type RestEndpointConstructorOptions<O extends RestGenerics = any> =
  RestEndpointOptions<
    RestFetch<
      'searchParams' extends keyof O
        ? O['searchParams'] & PathArgs<O['path']>
        : PathArgs<O['path']>,
      BodyDefault<O>,
      O['process'] extends {}
        ? ReturnType<O['process']>
        : any /*Denormalize<O['schema']>*/
    >
  >;

interface RestEndpointConstructor {
  new <O extends RestGenerics = any>({
    method,
    sideEffect,
    name,
    ...options
  }: Readonly<RestEndpointConstructorOptions<O> & O>): RestInstance<
    RestFetch<
      'searchParams' extends keyof O
        ? O['searchParams'] & PathArgs<O['path']>
        : PathArgs<O['path']>,
      BodyDefault<O>,
      O['process'] extends {}
        ? ReturnType<O['process']>
        : any /*Denormalize<O['schema']>*/
    >,
    O['schema'] extends Schema | undefined ? O['schema'] : undefined,
    MethodToSide<O['method']>
  >;
  readonly prototype: RestInstance;
}
/** Simplifies endpoint definitions that follow REST patterns
 *
 * @see https://resthooks.io/rest/api/RestEndpoint
 */
declare let RestEndpoint: RestEndpointConstructor;

type MethodToSide<M> = M extends string
  ? M extends 'GET'
    ? undefined
    : true
  : undefined;

/** RestEndpoint types simplified */
type RestType<
  UrlParams = any,
  Body = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  R = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
> = Body extends {}
  ? RestTypeWithBody<UrlParams, S, M, Body, R>
  : RestTypeNoBody<UrlParams, S, M, R>;

type RestTypeWithBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  Body extends BodyInit | Record<string, any> = any,
  R = any /*Denormalize<S>*/,
> = RestInstance<ParamFetchWithBody<UrlParams, Body, R>, S, M>;

type RestTypeNoBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  R = any /*Denormalize<S>*/,
> = RestInstance<ParamFetchNoBody<UrlParams, R>, S, M>;

/** Simple parameters, and body fetch functions */
type RestFetch<
  UrlParams,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Body = {},
  Resolve = any,
> = Body extends Record<string, unknown>
  ? ParamFetchWithBody<UrlParams, Body, Resolve>
  : ParamFetchNoBody<UrlParams, Resolve>;

type ParamFetchWithBody<
  P,
  B extends {} = {},
  R = any,
> = keyof P extends undefined
  ? (this: EndpointInstanceInterface, body: B) => Promise<R>
  : undefined extends P
  ? (this: EndpointInstanceInterface, body: B) => Promise<R>
  : (this: EndpointInstanceInterface, params: P, body: B) => Promise<R>;

type ParamFetchNoBody<P, R = any> = /*string extends keyof P
? (this: EndpointInstanceInterface, params?: P) => Promise<R>
:*/ P extends undefined
  ? (this: EndpointInstanceInterface) => Promise<R>
  : undefined extends P
  ? (this: EndpointInstanceInterface) => Promise<R>
  : (this: EndpointInstanceInterface, params: P) => Promise<R>;

type KeyofRestEndpoint = keyof RestInstance;

type FetchMutate<
  A extends readonly any[] =  // eslint-disable-next-line @typescript-eslint/ban-types
    | [any, {}]
    // eslint-disable-next-line @typescript-eslint/ban-types
    | [{}],
  R = any,
> = (this: RestInstance, ...args: A) => Promise<R>;

type FetchGet<A extends readonly any[] = [any], R = any> = (
  this: RestInstance,
  ...args: A
) => Promise<R>;

type GetEndpoint<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
> = RestTypeNoBody<UrlParams, S, undefined>;

type MutateEndpoint<
  UrlParams = any,
  Body extends BodyInit | Record<string, any> = any,
  S extends Schema | undefined = Schema | undefined,
> = RestTypeWithBody<UrlParams, S, true, Body>;

type Defaults<O, D> = {
  [K in keyof O | keyof D]: K extends keyof O
    ? Exclude<O[K], undefined>
    : D[Extract<K, keyof D>];
};

/** Creates collection of Endpoints for common operations on a given data/schema.
 *
 * @see https://resthooks.io/rest/api/createResource
 */
declare function createResource<U extends string, S extends Schema>({
  path,
  schema,
  Endpoint,
  ...extraOptions
}: {
  readonly path: U;
  readonly schema: S;
  readonly Endpoint?: typeof RestEndpoint;
  urlPrefix?: string;
} & EndpointExtraOptions): Resource<U, S>;
interface Resource<U extends string, S extends Schema> {
  /** Get a singular item
   *
   * @see https://resthooks.io/rest/api/createResource#get
   */
  get: GetEndpoint<PathArgs<U>, S>;
  /** Get a list of item
   *
   * @see https://resthooks.io/rest/api/createResource#getlist
   */
  getList: GetEndpoint<PathArgsAndSearch<ShortenPath<U>>, S[]>;
  /** Create a new item (POST)
   *
   * @see https://resthooks.io/rest/api/createResource#create
   */
  create: MutateEndpoint<PathArgs<ShortenPath<U>>, Partial<Denormalize<S>>, S>;
  /** Update an item (PUT)
   *
   * @see https://resthooks.io/rest/api/createResource#update
   */
  update: MutateEndpoint<PathArgs<U>, Partial<Denormalize<S>>, S>;
  /** Update an item (PATCH)
   *
   * @see https://resthooks.io/rest/api/createResource#partialupdate
   */
  partialUpdate: MutateEndpoint<PathArgs<U>, Partial<Denormalize<S>>, S>;
  /** Delete an item (DELETE)
   *
   * @see https://resthooks.io/rest/api/createResource#delete
   */
  delete: RestTypeNoBody<
    PathArgs<U>,
    S extends EntityInterface & {
      process: any;
    }
      ? Delete<S>
      : S,
    undefined,
    Partial<PathArgs<U>>
  >;
}

interface HookableEndpointInterface extends EndpointInterface {
  extend(...args: any): HookableEndpointInterface;
}
/** Turns a collection of Endpoints (Resource) into a collection of hooks.
 * This is useful for Endpoints that need hooks to prepare their fetch requests.
 *
 * @see https://resthooks.io/rest/api/hookifyResource
 */
declare function hookifyResource<
  R extends Record<string, HookableEndpointInterface>,
>(resource: R, useRequestInit: () => RequestInit): HookResource<R>;
declare type HookResource<R extends Record<string, HookableEndpointInterface>> =
  {
    [K in Extract<keyof R, string> as `use${Capitalize<K>}`]: () => R[K];
  };

/** An error with a Rest Endpoint fetch
 *
 * @see https://resthooks.io/rest/api/NetworkError
 */
declare class NetworkError extends Error {
  status: number;
  response: Response;
  name: string;
  constructor(response: Response);
}

declare function paginationUpdate<
  E extends {
    schema: Schema;
    key: any;
  } & ((...args: any) => Promise<any>),
  A extends any[],
>(
  endpoint: E,
  removeCursor: (...args: A) => readonly [...Parameters<typeof endpoint>],
): (
  newPage: any,
  ...args: A
) => {
  [x: number]: (existing: any) => any;
};

export {
  AbortOptimistic,
  AbstractInstanceType,
  ArrayElement,
  DELETED,
  Defaults,
  Denormalize,
  DenormalizeNullable,
  Endpoint,
  EndpointExtendOptions,
  EndpointExtraOptions,
  EndpointInstance,
  EndpointInstanceInterface,
  EndpointInterface,
  EndpointOptions,
  EndpointParam,
  Entity,
  ErrorTypes,
  ExpiryStatusInterface,
  ExtendableEndpoint,
  FetchFunction,
  FetchGet,
  FetchMutate,
  GetEndpoint,
  HookResource,
  HookableEndpointInterface,
  Index,
  IndexParams,
  KeyofEndpointInstance,
  KeyofRestEndpoint,
  MutateEndpoint,
  NetworkError,
  Normalize,
  NormalizeNullable,
  PathArgs,
  PathKeys,
  Query,
  ReadEndpoint,
  ResolveType,
  Resource,
  RestEndpoint,
  RestEndpointConstructorOptions,
  RestFetch,
  RestGenerics,
  RestType,
  Schema,
  SchemaDetail,
  SchemaList,
  ShortenPath,
  SnapshotInterface,
  UnknownError,
  createResource,
  hookifyResource,
  paginationUpdate,
  schema_d as schema,
  validateRequired,
};
