interface NetworkError extends Error {
    status: number;
    response?: Response;
}
interface UnknownError extends Error {
    status?: unknown;
    response?: unknown;
}
type ErrorTypes = NetworkError | UnknownError;

type AbstractInstanceType<T> = T extends new (...args: any) => infer U ? U : T extends {
    prototype: infer U;
} ? U : never;
type DenormalizeObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? Denormalize<S[K]> : S[K];
};
type DenormalizeNullableObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? DenormalizeNullable<S[K]> : S[K];
};
type NormalizeObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? Normalize<S[K]> : S[K];
};
type NormalizedNullableObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? NormalizeNullable<S[K]> : S[K];
};
interface NestedSchemaClass<T = any> {
    schema: Record<string, Schema>;
    prototype: T;
}
interface RecordClass<T = any> extends NestedSchemaClass<T> {
    fromJS: (...args: any) => AbstractInstanceType<T>;
}
type DenormalizeNullableNestedSchema<S extends NestedSchemaClass> = keyof S['schema'] extends never ? S['prototype'] : string extends keyof S['schema'] ? S['prototype'] : S['prototype'] & {
    [K in keyof S['schema']]: DenormalizeNullable<S['schema'][K]>;
};
type DenormalizeReturnType<T> = T extends (input: any, unvisit: any) => [infer R, any, any] ? R : never;
type NormalizeReturnType<T> = T extends (...args: any) => infer R ? R : never;
type Denormalize<S> = S extends EntityInterface<infer U> ? U : S extends RecordClass ? AbstractInstanceType<S> : S extends {
    denormalizeOnly: (...args: any) => any;
} ? ReturnType<S['denormalizeOnly']> : S extends {
    denormalize: (...args: any) => any;
} ? DenormalizeReturnType<S['denormalize']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Denormalize<F>[] : S extends {
    [K: string]: any;
} ? DenormalizeObject<S> : S;
type DenormalizeNullable<S> = S extends EntityInterface<any> ? DenormalizeNullableNestedSchema<S> | undefined : S extends RecordClass ? DenormalizeNullableNestedSchema<S> : S extends {
    _denormalizeNullable: (...args: any) => any;
} ? DenormalizeReturnType<S['_denormalizeNullable']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Denormalize<F>[] | undefined : S extends {
    [K: string]: any;
} ? DenormalizeNullableObject<S> : S;
type Normalize<S> = S extends EntityInterface ? string : S extends RecordClass ? NormalizeObject<S['schema']> : S extends {
    normalize: (...args: any) => any;
} ? NormalizeReturnType<S['normalize']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Normalize<F>[] : S extends {
    [K: string]: any;
} ? NormalizeObject<S> : S;
type NormalizeNullable<S> = S extends EntityInterface ? string | undefined : S extends RecordClass ? NormalizedNullableObject<S['schema']> : S extends {
    _normalizeNullable: (...args: any) => any;
} ? NormalizeReturnType<S['_normalizeNullable']> : S extends Serializable<infer T> ? T : S extends Array<infer F> ? Normalize<F>[] | undefined : S extends {
    [K: string]: any;
} ? NormalizedNullableObject<S> : S;
interface EntityMap<T = any> {
    readonly [k: string]: EntityInterface<T>;
}

interface SnapshotInterface {
    getResponse: <E extends Pick<EndpointInterface, 'key' | 'schema' | 'invalidIfStale'>, Args extends readonly [...Parameters<E['key']>]>(endpoint: E, ...args: Args) => {
        data: DenormalizeNullable<E['schema']>;
        expiryStatus: ExpiryStatusInterface;
        expiresAt: number;
    };
    getError: <E extends Pick<EndpointInterface, 'key'>, Args extends readonly [...Parameters<E['key']>]>(endpoint: E, ...args: Args) => ErrorTypes | undefined;
    readonly fetchedAt: number;
}
type ExpiryStatusInterface = 1 | 2 | 3;

/** What the function's promise resolves to */
type ResolveType<E extends (...args: any) => any> = ReturnType<E> extends Promise<infer R> ? R : never;
type PartialParameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? Partial<P> : never;
type EndpointToFunction<E extends (...args: any) => Promise<any>> = (this: E, ...args: Parameters<E>) => ReturnType<E>;

type FetchFunction<A extends readonly any[] = any, R = any> = (...args: A) => Promise<R>;
interface EndpointExtraOptions<F extends FetchFunction = FetchFunction> {
    /** Default data expiry length, will fall back to NetworkManager default if not defined */
    readonly dataExpiryLength?: number;
    /** Default error expiry length, will fall back to NetworkManager default if not defined */
    readonly errorExpiryLength?: number;
    /** Poll with at least this frequency in miliseconds */
    readonly pollFrequency?: number;
    /** Marks cached resources as invalid if they are stale */
    readonly invalidIfStale?: boolean;
    /** Determines whether to throw or fallback to */
    errorPolicy?(error: any): 'hard' | 'soft' | undefined;
    /** Enables optimistic updates for this request - uses return value as assumed network response */
    getOptimisticResponse?(snap: SnapshotInterface, ...args: Parameters<F>): ResolveType<F>;
    /** User-land extra data to send */
    readonly extra?: any;
}

type Schema = null | string | {
    [K: string]: any;
} | Schema[] | SchemaSimple | Serializable;
type Serializable<T extends {
    toJSON(): string;
} = {
    toJSON(): string;
}> = {
    prototype: T;
};
interface SchemaSimple<T = any> {
    normalize(input: any, parent: any, key: any, visit: (...args: any) => any, addEntity: (...args: any) => any, visitedEntities: Record<string, any>, storeEntities: any, args: any[]): any;
    denormalize(input: {}, unvisit: UnvisitFunction): [denormalized: T, found: boolean, suspend: boolean];
    denormalizeOnly?(input: {}, args: any, unvisit: (input: any, schema: any) => any): T;
    infer(args: readonly any[], indexes: NormalizedIndex, recurse: (...args: any) => any, entities: EntityTable): any;
}
interface SchemaSimpleNew<T = any> {
    normalize(input: any, parent: any, key: any, visit: (...args: any) => any, addEntity: (...args: any) => any, visitedEntities: Record<string, any>, storeEntities: any, args?: any[]): any;
    denormalizeOnly(input: {}, args: readonly any[], unvisit: (input: any, schema: any) => any): T;
    infer(args: readonly any[], indexes: NormalizedIndex, recurse: (...args: any) => any, entities: EntityTable): any;
}
interface EntityInterface<T = any> extends SchemaSimple {
    createIfValid?(props: any): any;
    pk(params: any, parent?: any, key?: string, args?: any[]): string | undefined;
    readonly key: string;
    merge(existing: any, incoming: any): any;
    expiresAt?(meta: any, input: any): number;
    mergeWithStore?(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
    mergeMetaWithStore?(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
    useIncoming?(existingMeta: any, incomingMeta: any, existing: any, incoming: any): boolean;
    indexes?: any;
    schema: Record<string, Schema>;
    prototype: T;
}
/** Represents Array or Values */
interface PolymorphicInterface<T = any> extends SchemaSimpleNew<T> {
    readonly schema: any;
    _normalizeNullable(): any;
    _denormalizeNullable(): [any, boolean, boolean];
}
interface UnvisitFunction {
    (input: any, schema: any): [any, boolean, boolean] | any;
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
    [entityKey: string]: {
        [pk: string]: unknown;
    } | undefined;
}
/** Defines a networking endpoint */
interface EndpointInterface<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined, M extends true | undefined = true | undefined> extends EndpointExtraOptions<F> {
    (...args: Parameters<F>): ReturnType<F>;
    key(...args: Parameters<F>): string;
    readonly sideEffect?: M;
    readonly schema?: S;
}

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
  bind<E extends FetchFunction, P extends PartialParameters<E>>(
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

  /* utilities */
  /** @see https://resthooks.io/rest/api/Endpoint#testKey */
  testKey(key: string): boolean;
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

type RemoveArray<Orig extends any[], Rem extends any[]> = Rem extends [
  any,
  ...infer RestRem,
]
  ? Orig extends [any, ...infer RestOrig]
    ? RemoveArray<RestOrig, RestRem>
    : never
  : Orig;

type CollectionOptions<Parent extends any[] = [
    urlParams: Record<string, any>,
    body?: Record<string, any>
]> = {
    nestKey: (parent: any, key: string) => Record<string, any>;
    createCollectionFilter?: (...args: Parent) => (collectionKey: Record<string, string>) => boolean;
} | {
    argsKey: (...args: any) => Record<string, any>;
    createCollectionFilter?: (...args: Parent) => (collectionKey: Record<string, string>) => boolean;
};

/**
 * Marks entity as Invalid.
 *
 * This triggers suspense for all endpoints requiring it.
 * Optional (like variable sized Array and Values) will simply remove the item.
 * @see https://resthooks.io/rest/api/Invalidate
 */
declare class Invalidate<E extends EntityInterface & {
    process: any;
}> implements SchemaSimpleNew {
    protected _entity: E;
    constructor(entity: E);
    get key(): string;
    /** Normalize lifecycles **/
    normalize(input: any, parent: any, key: string | undefined, visit: (...args: any) => any, addEntity: (...args: any) => any, visitedEntities: Record<string, any>, storeEntities: Record<string, any>, args?: any[]): string | undefined;
    merge(existing: any, incoming: any): any;
    mergeWithStore(existingMeta: any, incomingMeta: any, existing: any, incoming: any): any;
    mergeMetaWithStore(existingMeta: {
        expiresAt: number;
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        expiresAt: number;
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): {
        expiresAt: number;
        date: number;
        fetchedAt: number;
    };
    /** /End Normalize lifecycles **/
    infer(args: any, indexes: any, recurse: any): any;
    denormalizeOnly(id: string, args: readonly any[], unvisit: (input: any, schema: any) => any): AbstractInstanceType<E>;
    _denormalizeNullable(): [
        AbstractInstanceType<E> | undefined,
        boolean,
        false
    ];
    _normalizeNullable(): string | undefined;
}

/**
 * Represents arrays
 * @see https://resthooks.io/rest/api/Array
 */
declare class Array$1<S extends Schema = Schema> implements SchemaClass {
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
    storeEntities: any,
    args?: any[],
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

  denormalizeOnly(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): (S extends EntityMap<infer T> ? T : Denormalize<S>)[];

  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
  ): any;
}

/**
 * Represents objects with statically known members
 * @see https://resthooks.io/rest/api/Object
 */
declare class Object$1<O extends Record<string, any> = Record<string, Schema>>
  implements SchemaClass
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
    storeEntities: any,
    args?: any[],
  ): NormalizeObject<O>;

  _normalizeNullable(): NormalizedNullableObject<O>;

  denormalize(
    // eslint-disable-next-line @typescript-eslint/ban-types
    input: {},
    unvisit: UnvisitFunction,
  ): [denormalized: DenormalizeObject<O>, found: boolean, suspend: boolean];

  _denormalizeNullable(): [DenormalizeNullableObject<O>, false, boolean];

  denormalizeOnly(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): DenormalizeObject<O>;

  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
  ): any;
}

type CollectionArrayAdder<S extends PolymorphicInterface> = S extends {
  // ensure we are an array type
  denormalizeOnly(...args: any): any[];
  // get what we are an array of
  schema: infer T;
}
  ? // TODO: eventually we want to allow singular or list and infer the return based on arguments
    T
  : never;

declare class CollectionInterface<
  S extends PolymorphicInterface = any,
  Parent extends any[] = any,
> {
  addWith<P extends any[] = Parent>(
    merge: (existing: any, incoming: any) => any,
    createCollectionFilter?: (
      ...args: P
    ) => (collectionKey: Record<string, string>) => boolean,
  ): Collection<S, P>;

  readonly cacheWith: object;

  readonly schema: S;
  readonly key: string;
  pk(value: any, parent: any, key: string, args: any[]): string;
  normalize(
    input: any,
    parent: Parent,
    key: string,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
    storeEntities: any,
    args: any[],
  ): string;

  merge(existing: any, incoming: any): any;
  shouldReorder(
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

  mergeWithStore(
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
  ): any;

  mergeMetaWithStore(
    existingMeta: {
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    incomingMeta: {
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    existing: any,
    incoming: any,
  ): {
    expiresAt: number;
    date: number;
    fetchedAt: number;
  };

  infer(
    args: unknown,
    indexes: unknown,
    recurse: unknown,
    entities: unknown,
  ): any;

  createIfValid: (value: any) => any | undefined;
  denormalizeOnly(
    input: any,
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): ReturnType<S['denormalizeOnly']>;

  _denormalizeNullable(): ReturnType<S['_denormalizeNullable']>;
  _normalizeNullable(): ReturnType<S['_normalizeNullable']>;

  /** Schema to place at the *end* of this Collection
   * @see https://resthooks.io/rest/api/Collection#push
   */
  push: CollectionArrayAdder<S>;

  /** Schema to place at the *beginning* of this Collection
   * @see https://resthooks.io/rest/api/Collection#unshift
   */
  unshift: CollectionArrayAdder<S>;

  /** Schema to merge with a Values Collection
   * @see https://resthooks.io/rest/api/Collection#assign
   */
  assign: S extends { denormalizeOnly(...args: any): Record<string, unknown> }
    ? Collection<S, Parent>
    : never;
}
type CollectionFromSchema<
  S extends any[] | PolymorphicInterface = any,
  Parent extends any[] = [
    urlParams: Record<string, any>,
    body?: Record<string, any>,
  ],
> = CollectionInterface<S extends any[] ? Array$1<S[number]> : S, Parent>;

interface CollectionConstructor {
  new <
    S extends SchemaSimpleNew[] | PolymorphicInterface = any,
    Parent extends any[] = [
      urlParams: Record<string, any>,
      body?: Record<string, any>,
    ],
  >(
    schema: S,
    options?: CollectionOptions,
  ): CollectionFromSchema<S, Parent>;
  readonly prototype: CollectionInterface;
}
declare let CollectionRoot: CollectionConstructor;

/**
 * Entities but for Arrays instead of classes
 * @see https://resthooks.io/rest/api/Collection
 */
declare class Collection<
  S extends any[] | PolymorphicInterface = any,
  Parent extends any[] = [
    urlParams: Record<string, any>,
    body?: Record<string, any>,
  ],
> extends CollectionRoot<S, Parent> {}
type SchemaFunction<K = string> = (
  value: any,
  parent: any,
  key: string,
) => K;
type UnionResult<Choices extends EntityMap> = {
  id: string;
  schema: keyof Choices;
};
interface SchemaClass<T = any, N = T | undefined>
  extends SchemaSimple<T> {
  // this is not an actual member, but is needed for the recursive NormalizeNullable<> type algo
  _normalizeNullable(): any;
  // this is not an actual member, but is needed for the recursive DenormalizeNullable<> type algo
  _denormalizeNullable(): [N, boolean, boolean];
}

type ExtractObject<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? ExtractCollection<S[K]> : never;
}[keyof S];

type ExtractCollection<S extends Schema | undefined> = S extends {
    push: any;
    unshift: any;
    assign: any;
    schema: Schema;
} ? S : S extends Object$1<infer T> ? ExtractObject<T> : S extends Exclude<Schema, {
    [K: string]: any;
}> ? never : S extends {
    [K: string]: Schema;
} ? ExtractObject<S> : never;

type OnlyOptional<S extends string> = S extends `${infer K}?` ? K : never;
type OnlyRequired<S extends string> = S extends `${string}?` ? never : S;
/** Computes the union of keys for a path string */
type PathKeys<S extends string> = string extends S ? string : S extends `${infer A}\\:${infer B}` ? PathKeys<A> | PathKeys<B> : S extends `${infer A}\\?${infer B}` ? PathKeys<A> | PathKeys<B> : PathSplits<S>;
type PathSplits<S extends string> = S extends `${string}:${infer K}${'/' | ',' | '%' | '&'}${infer R}` ? PathSplits<`:${K}`> | PathSplits<R> : S extends `${string}:${infer K}:${infer R}` ? PathSplits<`:${K}`> | PathSplits<`:${R}`> : S extends `${string}:${infer K}` ? K : never;
/** Parameters for a given path */
type PathArgs<S extends string> = PathKeys<S> extends never ? unknown : KeysToArgs<PathKeys<S>>;
type KeysToArgs<Key extends string> = {
    [K in Key as OnlyOptional<K>]?: string | number;
} & (OnlyRequired<Key> extends never ? unknown : {
    [K in Key as OnlyRequired<K>]: string | number;
});
/** Removes the last :token */
type ShortenPath<S extends string> = string extends S ? string : S extends `${infer B}:${infer R}` ? TrimColon<`${B}:${ShortenPath<R>}`> : '';
type TrimColon<S extends string> = string extends S ? string : S extends `${infer R}:` ? R : S;
type ResourcePath = string;

type OptionsToFunction<O extends PartialRestGenerics, E extends {
    body?: any;
    path?: string;
    method?: string;
}, F extends FetchFunction> = 'path' extends keyof O ? RestFetch<'searchParams' extends keyof O ? O['searchParams'] & PathArgs<Exclude<O['path'], undefined>> : PathArgs<Exclude<O['path'], undefined>>, OptionsToBodyArgument<'body' extends keyof O ? O : E, 'method' extends keyof O ? O['method'] : E['method']>, O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>> : 'body' extends keyof O ? RestFetch<'searchParams' extends keyof O ? O['searchParams'] & PathArgs<Exclude<E['path'], undefined>> : PathArgs<Exclude<E['path'], undefined>>, OptionsToBodyArgument<O, 'method' extends keyof O ? O['method'] : E['method']>, O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>> : 'searchParams' extends keyof O ? RestFetch<O['searchParams'] & PathArgs<Exclude<E['path'], undefined>>, OptionsToBodyArgument<E, 'method' extends keyof O ? O['method'] : E['method']>, O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>> : (this: ThisParameterType<F>, ...args: Parameters<F>) => Promise<O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>>;
type OptionsToBodyArgument<O extends {
    body?: any;
}, Method extends string | undefined> = Method extends 'POST' | 'PUT' | 'PATCH' | 'DELETE' ? 'body' extends keyof O ? O['body'] : any : undefined;

type EndpointUpdateFunction<Source extends FetchFunction, Schema, Updaters extends Record<string, any> = Record<string, any>> = (source: ResultEntry<Source & {
    schema: Schema;
}>, ...args: Parameters<Source>) => {
    [K in keyof Updaters]: (result: Updaters[K]) => Updaters[K];
};
type ResultEntry<E extends FetchFunction & {
    schema: any;
}> = E['schema'] extends undefined | null ? ResolveType<E> : Normalize<E['schema']>;

/* eslint-disable @typescript-eslint/ban-types */


interface RestInstanceBase<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = any,
  M extends true | undefined = true | undefined,
  O extends {
    path: string;
    body?: any;
    searchParams?: any;
    method?: string;
  } = { path: string },
> extends EndpointInstanceInterface<F, S, M> {
  /** @see https://resthooks.io/rest/api/RestEndpoint#body */
  readonly body?: 'body' extends keyof O ? O['body'] : any;
  /** @see https://resthooks.io/rest/api/RestEndpoint#searchParams */
  readonly searchParams?: 'searchParams' extends keyof O
    ? O['searchParams']
    : // unknown is identity with '&' type operator
      unknown;

  /** Pattern to construct url based on Url Parameters
   * @see https://resthooks.io/rest/api/RestEndpoint#path
   */
  readonly path: O['path'];
  /** Prepended to all urls
   * @see https://resthooks.io/rest/api/RestEndpoint#urlPrefix
   */
  readonly urlPrefix: string;
  readonly requestInit: RequestInit;
  /** @see https://resthooks.io/rest/api/RestEndpoint#method */
  readonly method: (O & { method: string })['method'];
  readonly signal: AbortSignal | undefined;
  readonly paginationField?: string;

  /* fetch lifecycles */
  /* before-fetch */
  url(...args: Parameters<F>): string;
  /** @see https://resthooks.io/rest/api/RestEndpoint#getRequestInit */
  getRequestInit(
    this: any,
    body?: RequestInit['body'] | Record<string, unknown>,
  ): Promise<RequestInit> | RequestInit;
  /** @see https://resthooks.io/rest/api/RestEndpoint#getHeaders */
  getHeaders(headers: HeadersInit): Promise<HeadersInit> | HeadersInit;
  /* after-fetch */
  /** @see https://resthooks.io/rest/api/RestEndpoint#fetchResponse */
  fetchResponse(input: RequestInfo, init: RequestInit): Promise<Response>;
  /** @see https://resthooks.io/rest/api/RestEndpoint#parseResponse */
  parseResponse(response: Response): Promise<any>;
  /** @see https://resthooks.io/rest/api/RestEndpoint#process */
  process(value: any, ...args: Parameters<F>): ResolveType<F>;

  /* utilities */
  /** @see https://resthooks.io/rest/api/RestEndpoint#testKey */
  testKey(key: string): boolean;

  /* extenders */
  // TODO: figure out better way than wrapping whole options in Readonly<> + making O extend from {}
  //       this is just a hack to handle when no members of PartialRestGenerics are present
  //       Note: Using overloading (like paginated did) struggles because typescript does not have a clear way of distinguishing one
  //       should be used from the other (due to same problem with every member being partial)
  /** Creates a child endpoint that inherits from this while overriding provided `options`.
   * @see https://dataclient.io/rest/api/RestEndpoint#extend
   */
  extend<
    E extends RestInstanceBase,
    ExtendOptions extends PartialRestGenerics | {},
  >(
    this: E,
    options: Readonly<
      RestEndpointExtendOptions<ExtendOptions, E, F> & ExtendOptions
    >,
  ): RestExtendedEndpoint<ExtendOptions, E>;
}

interface RestInstance<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = any,
  M extends true | undefined = true | undefined,
  O extends {
    path: string;
    body?: any;
    searchParams?: any;
    method?: string;
    paginationField?: string;
  } = { path: string },
> extends RestInstanceBase<F, S, M, O> {
  /** Creates an Endpoint to append the next page extending a list for pagination
   * @see https://dataclient.io/rest/api/RestEndpoint#paginated
   */
  paginated<
    E extends RestInstanceBase<FetchFunction, any, undefined>,
    A extends any[],
  >(
    this: E,
    removeCursor: (...args: A) => readonly [...Parameters<E>],
  ): PaginationEndpoint<E, A>;
  paginated<
    E extends RestInstanceBase<FetchFunction, any, undefined>,
    C extends string,
  >(
    this: E,
    cursorField: C,
  ): PaginationFieldEndpoint<E, C>;
  /** Endpoint to append the next page extending a list for pagination
   * @see https://dataclient.io/rest/api/RestEndpoint#getPage
   */
  getPage: 'paginationField' extends keyof O
    ? O['paginationField'] extends string
      ? PaginationFieldEndpoint<
          F & { schema: S; sideEffect: M } & O,
          O['paginationField']
        >
      : undefined
    : undefined;
  /** Endpoint that pushes (place at end) a newly created entity to this Collection
   * @see https://dataclient.io/rest/api/RestEndpoint#push
   */
  push: AddEndpoint<
    F,
    ExtractCollection<S>['push'],
    Exclude<O, 'body' | 'method'> & {
      body:
        | OptionsToAdderBodyArgument<O>
        | OptionsToAdderBodyArgument<O>[]
        | FormData;
    }
  >;
  /** Endpoint that unshifts (place at start) a newly created entity to this Collection
   * @see https://dataclient.io/rest/api/RestEndpoint#unshift
   */
  unshift: AddEndpoint<
    F,
    ExtractCollection<S>['unshift'],
    Exclude<O, 'body' | 'method'> & {
      body:
        | OptionsToAdderBodyArgument<O>
        | OptionsToAdderBodyArgument<O>[]
        | FormData;
    }
  >;
  /** Endpoint that assigns newly created entities to their respective keys in this Collection
   * @see https://dataclient.io/rest/api/RestEndpoint#assign
   */
  assign: AddEndpoint<
    F,
    ExtractCollection<S>,
    Exclude<O, 'body' | 'method'> & {
      body: Record<string, OptionsToAdderBodyArgument<O>> | FormData;
    }
  >;
}

type RestEndpointExtendOptions<
  O extends PartialRestGenerics,
  E extends { body?: any; path?: string; schema?: Schema; method?: string },
  F extends FetchFunction,
> = RestEndpointOptions<
  OptionsToFunction<O, E, F>,
  'schema' extends keyof O
    ? Extract<O['schema'], Schema | undefined>
    : E['schema']
> &
  Partial<
    Omit<
      E,
      KeyofRestEndpoint | keyof PartialRestGenerics | keyof RestEndpointOptions
    >
  >;

type OptionsToRestEndpoint<
  O extends PartialRestGenerics,
  E extends RestInstanceBase & { body?: any; paginationField?: string },
  F extends FetchFunction,
> = 'path' extends keyof O
  ? RestType<
      'searchParams' extends keyof O
        ? O['searchParams'] extends undefined
          ? PathArgs<Exclude<O['path'], undefined>>
          : O['searchParams'] & PathArgs<Exclude<O['path'], undefined>>
        : PathArgs<Exclude<O['path'], undefined>>,
      OptionsToBodyArgument<
        'body' extends keyof O ? O : E,
        'method' extends keyof O ? O['method'] : E['method']
      >,
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>,
      {
        path: Exclude<O['path'], undefined>;
        body: 'body' extends keyof O ? O['body'] : E['body'];
        searchParams: 'searchParams' extends keyof O
          ? O['searchParams']
          : E['searchParams'];
        method: 'method' extends keyof O ? O['method'] : E['method'];
        paginationField: 'paginationField' extends keyof O
          ? O['paginationField']
          : E['paginationField'];
      }
    >
  : 'body' extends keyof O
  ? RestType<
      'searchParams' extends keyof O
        ? O['searchParams'] extends undefined
          ? PathArgs<Exclude<O['path'], undefined>>
          : O['searchParams'] & PathArgs<Exclude<E['path'], undefined>>
        : PathArgs<Exclude<E['path'], undefined>>,
      OptionsToBodyArgument<
        O,
        'method' extends keyof O ? O['method'] : E['method']
      >,
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>,
      {
        path: E['path'];
        body: O['body'];
        searchParams: 'searchParams' extends keyof O
          ? O['searchParams']
          : E['searchParams'];
        method: 'method' extends keyof O ? O['method'] : E['method'];
        paginationField: 'paginationField' extends keyof O
          ? O['paginationField']
          : Extract<E['paginationField'], string>;
      }
    >
  : 'searchParams' extends keyof O
  ? RestType<
      O['searchParams'] extends undefined
        ? PathArgs<Exclude<O['path'], undefined>>
        : O['searchParams'] & PathArgs<Exclude<E['path'], undefined>>,
      OptionsToBodyArgument<
        E,
        'method' extends keyof O ? O['method'] : E['method']
      >,
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      O['process'] extends {} ? ReturnType<O['process']> : ResolveType<F>,
      {
        path: E['path'];
        body: E['body'];
        searchParams: O['searchParams'];
        method: 'method' extends keyof O ? O['method'] : E['method'];
        paginationField: 'paginationField' extends keyof O
          ? O['paginationField']
          : Extract<E['paginationField'], string>;
      }
    >
  : RestInstance<
      F,
      'schema' extends keyof O ? O['schema'] : E['schema'],
      'method' extends keyof O ? MethodToSide<O['method']> : E['sideEffect'],
      {
        path: 'path' extends keyof O
          ? Exclude<O['path'], undefined>
          : E['path'];
        body: 'body' extends keyof O ? O['body'] : E['body'];
        searchParams: 'searchParams' extends keyof O
          ? O['searchParams']
          : E['searchParams'];
        method: 'method' extends keyof O ? O['method'] : E['method'];
        paginationField: 'paginationField' extends keyof O
          ? O['paginationField']
          : E['paginationField'];
      }
    >;

type RestExtendedEndpoint<
  O extends PartialRestGenerics,
  E extends RestInstanceBase & { getPage?: unknown },
> = OptionsToRestEndpoint<
  O,
  E &
    (E extends { getPage: { paginationField: string } }
      ? { paginationField: E['getPage']['paginationField'] }
      : unknown),
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
  Omit<O, KeyofRestEndpoint> &
  Omit<E, KeyofRestEndpoint | keyof O>;

interface PartialRestGenerics {
  /** @see https://resthooks.io/rest/api/RestEndpoint#path */
  readonly path?: string;
  /** @see https://resthooks.io/rest/api/RestEndpoint#schema */
  readonly schema?: Schema | undefined;
  /** @see https://resthooks.io/rest/api/RestEndpoint#method */
  readonly method?: string;
  /** Only used for types */
  /** @see https://dataclient.io/rest/api/RestEndpoint#body */
  body?: any;
  /** Only used for types */
  /** @see https://dataclient.io/rest/api/RestEndpoint#searchParams */
  searchParams?: any;
  /** @see https://dataclient.io/rest/api/RestEndpoint#paginationfield */
  readonly paginationField?: string;
  /** @see https://resthooks.io/rest/api/RestEndpoint#process */
  process?(value: any, ...args: any): any;
}
interface RestGenerics extends PartialRestGenerics {
  readonly path: string;
}

type PaginationEndpoint<
  E extends FetchFunction & RestGenerics & { sideEffect?: true | undefined },
  A extends any[],
> = RestInstanceBase<
  ParamFetchNoBody<A[0], ResolveType<E>>,
  E['schema'],
  E['sideEffect'],
  Pick<E, 'path' | 'searchParams' | 'body'> & {
    searchParams: Omit<A[0], keyof PathArgs<E['path']>>;
  }
>;
type PaginationFieldEndpoint<
  E extends FetchFunction & RestGenerics & { sideEffect?: true | undefined },
  C extends string,
> = RestInstanceBase<
  ParamFetchNoBody<
    { [K in C]: string | number | boolean } & E['searchParams'] &
      PathArgs<Exclude<E['path'], undefined>>,
    ResolveType<E>
  >,
  E['schema'],
  E['sideEffect'],
  Pick<E, 'path' | 'searchParams' | 'body'> & {
    searchParams: { [K in C]: string | number | boolean } & E['searchParams'];
  }
> & { paginationField: C };
type AddEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = any,
  O extends {
    path: string;
    body: any;
    searchParams?: any;
  } = { path: string; body: any },
> = RestInstanceBase<
  RestFetch<
    'searchParams' extends keyof O
      ? O['searchParams'] extends undefined
        ? PathArgs<Exclude<O['path'], undefined>>
        : O['searchParams'] & PathArgs<Exclude<O['path'], undefined>>
      : PathArgs<Exclude<O['path'], undefined>>,
    O['body'],
    ResolveType<F>
  >,
  S,
  true,
  Omit<O, 'method'> & { method: 'POST' }
>;

type OptionsToAdderBodyArgument<O extends { body?: any }> =
  'body' extends keyof O ? O['body'] : any;

interface RestEndpointOptions<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = undefined,
> extends EndpointExtraOptions<F> {
  urlPrefix?: string;
  requestInit?: RequestInit;
  getHeaders?(headers: HeadersInit): Promise<HeadersInit> | HeadersInit;
  getRequestInit?(body: any): Promise<RequestInit> | RequestInit;
  fetchResponse?(input: RequestInfo, init: RequestInit): Promise<any>;
  parseResponse?(response: Response): Promise<any>;

  sideEffect?: true | undefined;
  name?: string;
  signal?: AbortSignal;
  fetch?: F;
  key?(...args: Parameters<F>): string;
  url?(...args: Parameters<F>): string;
  update?: EndpointUpdateFunction<F, S>;
}

type RestEndpointConstructorOptions<O extends RestGenerics = any> =
  RestEndpointOptions<
    RestFetch<
      'searchParams' extends keyof O
        ? O['searchParams'] extends undefined
          ? PathArgs<O['path']>
          : O['searchParams'] & PathArgs<O['path']>
        : PathArgs<O['path']>,
      OptionsToBodyArgument<
        O,
        'method' extends keyof O
          ? O['method']
          : O extends { sideEffect: true }
          ? 'POST'
          : 'GET'
      >,
      O['process'] extends {}
        ? ReturnType<O['process']>
        : any /*Denormalize<O['schema']>*/
    >,
    O['schema']
  >;

interface RestEndpointConstructor {
  new <O extends RestGenerics = any>({
    method,
    sideEffect,
    name,
    ...options
  }: RestEndpointConstructorOptions<O> & Readonly<O>): RestInstance<
    RestFetch<
      'searchParams' extends keyof O
        ? O['searchParams'] extends undefined
          ? PathArgs<O['path']>
          : O['searchParams'] & PathArgs<O['path']>
        : PathArgs<O['path']>,
      OptionsToBodyArgument<
        O,
        'method' extends keyof O
          ? O['method']
          : O extends { sideEffect: true }
          ? 'POST'
          : 'GET'
      >,
      O['process'] extends {}
        ? ReturnType<O['process']>
        : any /*Denormalize<O['schema']>*/
    >,
    'schema' extends keyof O ? O['schema'] : undefined,
    'sideEffect' extends keyof O
      ? Extract<O['sideEffect'], undefined | true>
      : MethodToSide<O['method']>,
    'method' extends keyof O
      ? O
      : O & {
          method: O extends { sideEffect: true } ? 'POST' : 'GET';
        }
  >;
  readonly prototype: RestInstanceBase;
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
  O extends {
    path: string;
    body?: any;
    searchParams?: any;
    paginationField?: string;
  } = { path: string; paginationField: string },
  // eslint-disable-next-line @typescript-eslint/ban-types
> = IfTypeScriptLooseNull<
  RestInstance<
    keyof UrlParams extends never
      ? (this: EndpointInstanceInterface, body?: Body) => Promise<R>
      : // even with loose null, this will only be true when all members are optional
      {} extends UrlParams
      ?
          | ((this: EndpointInstanceInterface, body?: Body) => Promise<R>)
          | ((
              this: EndpointInstanceInterface,
              params: UrlParams,
              body?: Body,
            ) => Promise<R>)
      : (
          this: EndpointInstanceInterface,
          params: UrlParams,
          body?: Body,
        ) => Promise<R>,
    S,
    M,
    O
  >,
  Body extends {}
    ? RestTypeWithBody<UrlParams, S, M, Body, R, O>
    : RestTypeNoBody<UrlParams, S, M, R, O>
>;

type RestTypeWithBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  Body = any,
  R = any /*Denormalize<S>*/,
  O extends {
    path: string;
    body?: any;
    searchParams?: any;
  } = { path: string; body: any },
> = RestInstance<ParamFetchWithBody<UrlParams, Body, R>, S, M, O>;

type RestTypeNoBody<
  UrlParams = any,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
  R = any /*Denormalize<S>*/,
  O extends {
    path: string;
    body?: undefined;
    searchParams?: any;
  } = { path: string; body: undefined },
> = RestInstance<ParamFetchNoBody<UrlParams, R>, S, M, O>;

/** Simple parameters, and body fetch functions */
type RestFetch<
  UrlParams,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Body = {},
  Resolve = any,
> = IfTypeScriptLooseNull<
  | ParamFetchNoBody<UrlParams, Resolve>
  | ParamFetchWithBody<UrlParams, Body, Resolve>,
  Body extends {}
    ? ParamFetchWithBody<UrlParams, Body, Resolve>
    : ParamFetchNoBody<UrlParams, Resolve>
>;

type ParamFetchWithBody<P, B = {}, R = any> =
  // we must always allow undefined in a union and give it a type without params
  P extends undefined
    ? (this: EndpointInstanceInterface, body: B) => Promise<R>
    : // even with loose null, this will only be true when all members are optional
    {} extends P
    ? // this safely handles PathArgs with no members that results in a simple `unknown` type
      keyof P extends never
      ? (this: EndpointInstanceInterface, body: B) => Promise<R>
      :
          | ((
              this: EndpointInstanceInterface,
              params: P,
              body: B,
            ) => Promise<R>)
          | ((this: EndpointInstanceInterface, body: B) => Promise<R>)
    : (this: EndpointInstanceInterface, params: P, body: B) => Promise<R>;

type ParamFetchNoBody<P, R = any> =
  // we must always allow undefined in a union and give it a type without params
  P extends undefined
    ? (this: EndpointInstanceInterface) => Promise<R>
    : // even with loose null, this will only be true when all members are optional
    {} extends P
    ? // this safely handles PathArgs with no members that results in a simple `unknown` type
      keyof P extends never
      ? (this: EndpointInstanceInterface) => Promise<R>
      :
          | ((this: EndpointInstanceInterface, params: P) => Promise<R>)
          | ((this: EndpointInstanceInterface) => Promise<R>)
    : (this: EndpointInstanceInterface, params: P) => Promise<R>;

type IfTypeScriptLooseNull<Y, N> = 1 | undefined extends 1 ? Y : N;

type KeyofRestEndpoint = keyof RestInstance;

type FromFallBack<K extends keyof E, O, E> = K extends keyof O
  ? O[K]
  : E[K];

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

type Defaults<O, D> = {
  [K in keyof O | keyof D]: K extends keyof O
    ? Exclude<O[K], undefined>
    : D[Extract<K, keyof D>];
};

type GetEndpoint<
  O extends {
    readonly path: string;
    readonly schema: Schema;
    /** Only used for types */
    readonly searchParams?: any;
    readonly paginationField?: string;
  } = {
    path: string;
    schema: Schema;
  },
> = RestTypeNoBody<
  'searchParams' extends keyof O
    ? O['searchParams'] extends undefined
      ? PathArgs<O['path']>
      : O['searchParams'] & PathArgs<O['path']>
    : PathArgs<O['path']>,
  O['schema'],
  undefined,
  any,
  O & { method: 'GET' }
>;

type MutateEndpoint<
  O extends {
    readonly path: string;
    readonly schema: Schema;
    /** Only used for types */
    readonly searchParams?: any;
    /** Only used for types */
    readonly body?: any;
  } = {
    path: string;
    body: any;
    schema: Schema;
  },
> = RestTypeWithBody<
  'searchParams' extends keyof O
    ? O['searchParams'] extends undefined
      ? PathArgs<O['path']>
      : O['searchParams'] & PathArgs<O['path']>
    : PathArgs<O['path']>,
  O['schema'],
  true,
  O['body'],
  any,
  O & { body: any; method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' }
>;

type ResourceExtension<R extends {
    [K in ExtendKey]: RestInstanceBase;
}, ExtendKey extends Exclude<Extract<keyof R, string>, 'extend'>, O extends PartialRestGenerics | {}> = {
    [K in keyof R]: K extends ExtendKey ? RestExtendedEndpoint<O, R[K]> : R[K];
};
/** Resource with individual endpoints customized
 *
 */
interface CustomResource<R extends ResourceInterface, O extends ResourceGenerics = {
    path: ResourcePath;
    schema: any;
}, Get extends PartialRestGenerics | {} = any, GetList extends PartialRestGenerics | {} = any, Update extends PartialRestGenerics | {} = any, PartialUpdate extends PartialRestGenerics | {} = any, Delete extends PartialRestGenerics | {} = any> extends Extendable<O> {
    get: unknown extends Get ? R['get'] : RestExtendedEndpoint<Get, R['get']>;
    getList: unknown extends GetList ? R['getList'] : RestExtendedEndpoint<GetList, R['getList']>;
    update: unknown extends Update ? R['update'] : RestExtendedEndpoint<Update, R['update']>;
    partialUpdate: unknown extends PartialUpdate ? R['partialUpdate'] : RestExtendedEndpoint<PartialUpdate, R['partialUpdate']>;
    delete: unknown extends Delete ? R['delete'] : RestExtendedEndpoint<Delete, R['delete']>;
}
type ExtendedResource<R extends ResourceInterface, T extends Record<string, EndpointInterface>> = Omit<R, keyof T> & T;
interface ResourceEndpointExtensions<R extends ResourceInterface, Get extends PartialRestGenerics = any, GetList extends PartialRestGenerics = any, Update extends PartialRestGenerics = any, PartialUpdate extends PartialRestGenerics = any, Delete extends PartialRestGenerics = any> {
    readonly get?: RestEndpointOptions<unknown extends Get ? EndpointToFunction<R['get']> : OptionsToFunction<Get, R['get'], EndpointToFunction<R['get']>>, R['get']['schema']> & Readonly<Get>;
    readonly getList?: RestEndpointOptions<unknown extends GetList ? EndpointToFunction<R['getList']> : OptionsToFunction<GetList, R['getList'], EndpointToFunction<R['getList']>>, R['getList']['schema']> & Readonly<GetList>;
    readonly update?: RestEndpointOptions<unknown extends Update ? EndpointToFunction<R['update']> : OptionsToFunction<Update, R['update'], EndpointToFunction<R['update']>>, R['update']['schema']> & Readonly<Update>;
    readonly partialUpdate?: RestEndpointOptions<unknown extends PartialUpdate ? EndpointToFunction<R['partialUpdate']> : OptionsToFunction<PartialUpdate, R['partialUpdate'], EndpointToFunction<R['partialUpdate']>>, R['partialUpdate']['schema']> & Readonly<PartialUpdate>;
    readonly delete?: RestEndpointOptions<unknown extends Delete ? EndpointToFunction<R['delete']> : OptionsToFunction<Delete, R['delete'], EndpointToFunction<R['delete']>>, R['delete']['schema']> & Readonly<Delete>;
}

interface Extendable<O extends ResourceGenerics = {
    path: ResourcePath;
    schema: any;
}> {
    /** Allows customizing individual endpoints
     *
     * @see https://dataclient.io/rest/api/createResource#extend
     */
    extend<R extends {
        [K in ExtendKey]: RestInstanceBase;
    }, const ExtendKey extends Exclude<Extract<keyof R, string>, 'extend'>, ExtendOptions extends PartialRestGenerics | {}>(this: R, key: ExtendKey, options: Readonly<RestEndpointExtendOptions<ExtendOptions, R[ExtendKey], EndpointToFunction<R[ExtendKey]>> & ExtendOptions>): ResourceExtension<R, ExtendKey, ExtendOptions>;
    extend<R extends {
        get: RestInstanceBase;
    }, const ExtendKey extends string, ExtendOptions extends PartialRestGenerics | {}>(this: R, key: ExtendKey, options: Readonly<RestEndpointExtendOptions<ExtendOptions, R['get'], EndpointToFunction<R['get']>> & ExtendOptions>): R & {
        [key in ExtendKey]: RestExtendedEndpoint<ExtendOptions, R['get']>;
    };
    extend<R extends ResourceInterface, Get extends PartialRestGenerics = any, GetList extends PartialRestGenerics = any, Update extends PartialRestGenerics = any, PartialUpdate extends PartialRestGenerics = any, Delete extends PartialRestGenerics = any>(this: R, options: ResourceEndpointExtensions<R, Get, GetList, Update, PartialUpdate, Delete>): CustomResource<R, O, Get, GetList, Update, PartialUpdate, Delete>;
    extend<R extends ResourceInterface, T extends Record<string, EndpointInterface>>(this: R, extender: (baseResource: R) => T): ExtendedResource<R, T>;
}

/** The typed (generic) options for a Resource */
interface ResourceGenerics {
    /** @see https://resthooks.io/rest/api/createResource#path */
    readonly path: ResourcePath;
    /** @see https://resthooks.io/rest/api/createResource#schema */
    readonly schema: Schema;
    /** Only used for types */
    /** @see https://dataclient.io/rest/api/createResource#body */
    readonly body?: any;
    /** Only used for types */
    /** @see https://resthooks.io/rest/api/createResource#searchParams */
    readonly searchParams?: any;
    /** @see https://resthooks.io/rest/api/createResource#paginationfield */
    readonly paginationField?: string;
}
/** The untyped options for createResource() */
interface ResourceOptions {
    /** @see https://resthooks.io/rest/api/createResource#endpoint */
    Endpoint?: typeof RestEndpoint;
    /** @see https://resthooks.io/rest/api/createResource#optimistic */
    optimistic?: boolean;
    /** @see https://resthooks.io/rest/api/createResource#urlprefix */
    urlPrefix?: string;
    requestInit?: RequestInit;
    getHeaders?(headers: HeadersInit): Promise<HeadersInit> | HeadersInit;
    getRequestInit?(body: any): Promise<RequestInit> | RequestInit;
    fetchResponse?(input: RequestInfo, init: RequestInit): Promise<any>;
    parseResponse?(response: Response): Promise<any>;
    /** Default data expiry length, will fall back to NetworkManager default if not defined */
    readonly dataExpiryLength?: number;
    /** Default error expiry length, will fall back to NetworkManager default if not defined */
    readonly errorExpiryLength?: number;
    /** Poll with at least this frequency in miliseconds */
    readonly pollFrequency?: number;
    /** Marks cached resources as invalid if they are stale */
    readonly invalidIfStale?: boolean;
    /** Determines whether to throw or fallback to */
    errorPolicy?(error: any): 'hard' | 'soft' | undefined;
}
/** Resources are a collection of methods for a given data model.
 * @see https://resthooks.io/rest/api/createResource
 */
interface Resource<O extends ResourceGenerics = {
    path: ResourcePath;
    schema: any;
}> extends Extendable<O> {
    /** Get a singular item
     *
     * @see https://resthooks.io/rest/api/createResource#get
     */
    get: GetEndpoint<{
        path: O['path'];
        schema: O['schema'];
    }>;
    /** Get a list of item
     *
     * @see https://resthooks.io/rest/api/createResource#getlist
     */
    getList: 'searchParams' extends keyof O ? GetEndpoint<{
        path: ShortenPath<O['path']>;
        schema: Collection<[O['schema']]>;
        body: 'body' extends keyof O ? O['body'] : Partial<Denormalize<O['schema']>>;
        searchParams: O['searchParams'];
    } & Pick<O, 'paginationField'>> : GetEndpoint<{
        path: ShortenPath<O['path']>;
        schema: Collection<[O['schema']]>;
        body: 'body' extends keyof O ? O['body'] : Partial<Denormalize<O['schema']>>;
        searchParams: Record<string, number | string | boolean> | undefined;
    } & Pick<O, 'paginationField'>>;
    /** Create a new item (POST)
     *
     * @deprecated use Resource.getList.push instead
     */
    create: 'searchParams' extends keyof O ? MutateEndpoint<{
        path: ShortenPath<O['path']>;
        schema: Collection<[O['schema']]>['push'];
        body: 'body' extends keyof O ? O['body'] : Partial<Denormalize<O['schema']>>;
        searchParams: O['searchParams'];
    }> : MutateEndpoint<{
        path: ShortenPath<O['path']>;
        schema: Collection<[O['schema']]>['push'];
        body: 'body' extends keyof O ? O['body'] : Partial<Denormalize<O['schema']>>;
    }>;
    /** Update an item (PUT)
     *
     * @see https://resthooks.io/rest/api/createResource#update
     */
    update: 'body' extends keyof O ? MutateEndpoint<{
        path: O['path'];
        body: O['body'];
        schema: O['schema'];
    }> : MutateEndpoint<{
        path: O['path'];
        body: Partial<Denormalize<O['schema']>> | FormData;
        schema: O['schema'];
    }>;
    /** Update an item (PATCH)
     *
     * @see https://resthooks.io/rest/api/createResource#partialupdate
     */
    partialUpdate: 'body' extends keyof O ? MutateEndpoint<{
        path: O['path'];
        body: Partial<O['body']>;
        schema: O['schema'];
    }> : MutateEndpoint<{
        path: O['path'];
        body: Partial<Denormalize<O['schema']>> | FormData;
        schema: O['schema'];
    }>;
    /** Delete an item (DELETE)
     *
     * @see https://resthooks.io/rest/api/createResource#delete
     */
    delete: RestTypeNoBody<PathArgs<O['path']>, O['schema'] extends EntityInterface & {
        process: any;
    } ? Invalidate<O['schema']> : O['schema'], undefined, Partial<PathArgs<O['path']>>, {
        path: O['path'];
    }>;
}
interface ResourceInterface {
    get: RestInstanceBase;
    getList: RestInstanceBase;
    update: RestInstanceBase;
    partialUpdate: RestInstanceBase;
    delete: RestInstanceBase;
}

/** Creates collection of Endpoints for common operations on a given data/schema.
 *
 * @see https://resthooks.io/rest/api/createResource
 */
declare function createResource<O extends ResourceGenerics>({ path, schema, Endpoint, optimistic, paginationField, ...extraOptions }: Readonly<O> & ResourceOptions): Resource<O>;

export { AddEndpoint, Defaults, FetchGet, FetchMutate, FromFallBack, GetEndpoint, KeyofRestEndpoint, MethodToSide, MutateEndpoint, PaginationEndpoint, PaginationFieldEndpoint, ParamFetchNoBody, ParamFetchWithBody, PartialRestGenerics, Resource, ResourceGenerics, ResourceOptions, RestEndpoint, RestEndpointConstructor, RestEndpointConstructorOptions, RestEndpointExtendOptions, RestEndpointOptions, RestExtendedEndpoint, RestFetch, RestGenerics, RestInstance, RestInstanceBase, RestType, RestTypeNoBody, RestTypeWithBody, createResource };
