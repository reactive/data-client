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
    input: Record<string, unknown>,
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

/** Link in a chain */
declare class Link<K extends object, V> {
  children: WeakMap<K, Link<K, V>>;
  value?: V;
}
/** Maps from a list of objects (referentially) to any value
 *
 * If *any* members of the list get claned up, so does that key/value pair get removed.
 */
declare class WeakListMap<K extends object, V> {
  readonly first: WeakMap<K, Link<K, V>>;
  delete(key: K[]): boolean;
  get(key: K[]): V | undefined;
  has(key: K[]): boolean;
  set(key: K[], value: V): WeakListMap<K, V>;
  protected traverse(key: K[]): Link<K, V> | undefined;
}

declare type AbstractInstanceType<T> = T extends {
  prototype: infer U;
}
  ? U
  : never;
declare type DenormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Denormalize$1<S[K]> : S[K];
};
declare type DenormalizeNullableObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? DenormalizeNullable$1<S[K]> : S[K];
};
declare type NormalizeObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? Normalize$1<S[K]> : S[K];
};
declare type NormalizedNullableObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? NormalizeNullable$1<S[K]> : S[K];
};
interface NestedSchemaClass<T = any> {
  schema: Record<string, Schema>;
  prototype: T;
}
interface RecordClass<T = any> extends NestedSchemaClass<T> {
  fromJS: (...args: any) => AbstractInstanceType<T>;
}
interface DenormalizeCache {
  entities: {
    [key: string]: {
      [pk: string]: WeakListMap<object, EntityInterface>;
    };
  };
  results: {
    [key: string]: WeakListMap<object, any>;
  };
}
declare type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> =
  keyof S['schema'] extends never
    ? S['prototype']
    : string extends keyof S['schema']
    ? S['prototype']
    : S['prototype'];
declare type DenormalizeReturnType<T> = T extends (
  input: any,
  unvisit: any,
) => [infer R, any, any]
  ? R
  : never;
declare type NormalizeReturnType<T> = T extends (...args: any) => infer R
  ? R
  : never;
declare type Denormalize$1<S> = S extends EntityInterface<infer U>
  ? U
  : S extends RecordClass
  ? AbstractInstanceType<S>
  : S extends SchemaClass
  ? DenormalizeReturnType<S['denormalize']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Denormalize$1<F>[]
  : S extends {
      [K: string]: any;
    }
  ? DenormalizeObject<S>
  : S;
declare type DenormalizeNullable$1<S> = S extends EntityInterface<any>
  ? DenormalizeNullableNestedSchema<S> | undefined
  : S extends RecordClass
  ? DenormalizeNullableNestedSchema<S>
  : S extends SchemaClass
  ? DenormalizeReturnType<S['_denormalizeNullable']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Denormalize$1<F>[] | undefined
  : S extends {
      [K: string]: any;
    }
  ? DenormalizeNullableObject<S>
  : S;
declare type Normalize$1<S> = S extends EntityInterface
  ? string
  : S extends RecordClass
  ? NormalizeObject<S['schema']>
  : S extends SchemaClass
  ? NormalizeReturnType<S['normalize']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Normalize$1<F>[]
  : S extends {
      [K: string]: any;
    }
  ? NormalizeObject<S>
  : S;
declare type NormalizeNullable$1<S> = S extends EntityInterface
  ? string | undefined
  : S extends RecordClass
  ? NormalizedNullableObject<S['schema']>
  : S extends SchemaClass
  ? NormalizeReturnType<S['_normalizeNullable']>
  : S extends Serializable<infer T>
  ? T
  : S extends Array<infer F>
  ? Normalize$1<F>[] | undefined
  : S extends {
      [K: string]: any;
    }
  ? NormalizedNullableObject<S>
  : S;
declare type NormalizedSchema<E, R> = {
  entities: E;
  result: R;
  indexes: NormalizedIndex;
  entityMeta: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly date: number;
        readonly expiresAt: number;
        readonly fetchedAt: number;
      };
    };
  };
};

declare type DenormalizeReturn<S extends Schema> =
  | [
      denormalized: Denormalize$1<S>,
      found: true,
      deleted: false,
      resolvedEntities: Record<string, Record<string, any>>,
    ]
  | [
      denormalized: DenormalizeNullable$1<S>,
      found: boolean,
      deleted: true,
      resolvedEntities: Record<string, Record<string, any>>,
    ]
  | [
      denormalized: DenormalizeNullable$1<S>,
      found: false,
      deleted: boolean,
      resolvedEntities: Record<string, Record<string, any>>,
    ];
declare const denormalize: <S extends Schema>(
  input: unknown,
  schema: S | undefined,
  entities: any,
  entityCache?: DenormalizeCache['entities'],
  resultCache?: WeakListMap<object, any>,
) => DenormalizeReturn<S>;

declare const normalize: <
  S extends Schema = Schema,
  E extends Record<string, Record<string, any> | undefined> = Record<
    string,
    Record<string, any>
  >,
  R = NormalizeNullable$1<S>,
>(
  input: any,
  schema?: S | undefined,
  existingEntities?: Readonly<E>,
  existingIndexes?: Readonly<NormalizedIndex>,
  existingEntityMeta?: {
    readonly [entityKey: string]: {
      readonly [pk: string]: {
        readonly date: number;
        readonly expiresAt: number;
        readonly fetchedAt: number;
      };
    };
  },
  meta?: {
    expiresAt: number;
    date: number;
    fetchedAt?: number;
  },
) => NormalizedSchema<E, R>;

declare function isEntity(schema: Schema): schema is EntityInterface;

/**
 * Build the result parameter to denormalize from schema alone.
 * Tries to compute the entity ids from params.
 */
declare function inferResults<S extends Schema>(
  schema: S,
  args: any[],
  indexes: NormalizedIndex,
  entities?: EntityTable,
): NormalizeNullable$1<S>;

declare const DELETED: unique symbol;

interface NetworkError extends Error {
  status: number;
  response?: Response;
}
interface UnknownError extends Error {
  status?: unknown;
  response?: unknown;
}
declare type ErrorTypes = NetworkError | UnknownError;

/** What the function's promise resolves to */
declare type ResolveType<E extends (...args: any) => any> =
  ReturnType<E> extends Promise<infer R> ? R : never;
/** Fallback to schema if fetch function isn't defined */
declare type InferReturn<
  F extends FetchFunction,
  S extends Schema | undefined,
> = S extends undefined
  ? ReturnType<F>
  : ReturnType<F> extends unknown
  ? Promise<Denormalize$1<S>>
  : ReturnType<F>;

interface IndexInterface<S extends Schema = Schema, P = object> {
  key(params?: P): string;
  readonly schema: S;
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

declare const enum ExpiryStatus {
  Invalid = 1,
  InvalidIfStale = 2,
  Valid = 3,
}
declare type ExpiryStatusInterface = 1 | 2 | 3;

interface SnapshotInterface {
  getResponse: <
    E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>,
    Args extends readonly [...Parameters<E['key']>],
  >(
    endpoint: E,
    ...args: Args
  ) => {
    data: DenormalizeNullable$1<E['schema']>;
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

/** Defines a networking endpoint */
interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
> extends EndpointExtraOptions<F> {
  (...args: Parameters<F>): InferReturn<F, S>;
  key(...args: Parameters<F>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}
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
declare type OptimisticUpdateParams<
  SourceSchema extends Schema | undefined,
  Dest extends EndpointInterface<FetchFunction, Schema, any>,
> = [
  Dest,
  Parameters<Dest>[0],
  UpdateFunction<SourceSchema, Exclude<Dest['schema'], undefined>>,
];
declare type UpdateFunction<
  SourceSchema extends Schema | undefined,
  DestSchema extends Schema,
> = (
  sourceResults: Normalize$1<SourceSchema>,
  destResults: Normalize$1<DestSchema> | undefined,
) => Normalize$1<DestSchema>;
/** To change values on the server */
interface MutateEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
> extends EndpointInterface<F, S, true> {
  sideEffect: true;
}
/** For retrieval requests */
declare type ReadEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
> = EndpointInterface<F, S, undefined>;

declare type FetchFunction<A extends readonly any[] = any, R = any> = (
  ...args: A
) => Promise<R>;

/** This file exists to keep compatibility with SchemaDetail, and SchemaList type hacks
 * Support can be dropped once @rest-hooks/rest@5 support is dropped
 */

declare type Denormalize<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? Denormalize$1<S>
    : Denormalize$1<Extract<S, EntityInterface[]>>
  : Denormalize$1<Extract<S, EntityInterface>>;
declare type DenormalizeNullable<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? DenormalizeNullable$1<S>
    : DenormalizeNullable$1<Extract<S, EntityInterface[]>>
  : DenormalizeNullable$1<Extract<S, EntityInterface>>;
declare type Normalize<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? Normalize$1<S>
    : Normalize$1<Extract<S, EntityInterface[]>>
  : Normalize$1<Extract<S, EntityInterface>>;
declare type NormalizeNullable<S> = Extract<S, EntityInterface> extends never
  ? Extract<S, EntityInterface[]> extends never
    ? NormalizeNullable$1<S>
    : NormalizeNullable$1<Extract<S, EntityInterface[]>>
  : NormalizeNullable$1<Extract<S, EntityInterface>>;

export {
  AbstractInstanceType,
  ArrayElement,
  DELETED,
  Denormalize,
  DenormalizeCache,
  DenormalizeNullable,
  DenormalizeReturnType,
  EndpointExtraOptions,
  EndpointInterface,
  EntityInterface,
  EntityTable,
  ErrorTypes,
  ExpiryStatus,
  ExpiryStatusInterface,
  FetchFunction,
  IndexInterface,
  IndexParams,
  InferReturn,
  MutateEndpoint,
  NetworkError,
  Normalize,
  NormalizeNullable,
  NormalizeReturnType,
  NormalizedIndex,
  NormalizedSchema,
  OptimisticUpdateParams,
  ReadEndpoint,
  ResolveType,
  Schema,
  SchemaClass,
  SchemaSimple,
  Serializable,
  SnapshotInterface,
  UnknownError,
  UnvisitFunction,
  UpdateFunction,
  WeakListMap,
  denormalize,
  inferResults,
  isEntity,
  normalize,
};
