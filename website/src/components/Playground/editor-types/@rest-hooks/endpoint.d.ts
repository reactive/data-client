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

type CollectionOptions<Parent extends any[] = [
    urlParams: Record<string, any>,
    body?: Record<string, any>
]> = {
    nestKey: (parent: any, key: string) => Record<string, any>;
    createCollectionFilter?: (...args: Parent) => (collectionKey: Record<string, any>) => boolean;
} | {
    argsKey: (...args: any) => Record<string, any>;
    createCollectionFilter?: (...args: Parent) => (collectionKey: Record<string, any>) => boolean;
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
 * Marks entity as deleted.
 * @see https://resthooks.io/rest/api/Delete
 */
declare class Delete<E extends EntityInterface & {
    process: any;
}> extends Invalidate<E> implements SchemaClass$1 {
    denormalize(id: string, unvisit: UnvisitFunction): [denormalized: AbstractInstanceType<E>, found: boolean, suspend: boolean];
}

type Constructor = abstract new (...args: any[]) => {};
type IDClass = abstract new (...args: any[]) => {
    id: string | number | undefined;
};
type PKClass = abstract new (...args: any[]) => {
    pk(parent?: any, key?: string, args?: readonly any[]): string | undefined;
};
type ValidSchemas<TInstance> = {
    [k in keyof TInstance]?: Schema;
};
type EntityOptions<TInstance extends {}> = {
    readonly schema?: ValidSchemas<TInstance>;
    readonly pk?: ((value: TInstance, parent?: any, key?: string) => string | undefined) | keyof TInstance;
    readonly key?: string;
} & {
    readonly [K in Extract<keyof IEntityClass, 'process' | 'merge' | 'expiresAt' | 'createIfValid' | 'mergeWithStore' | 'validate' | 'shouldReorder' | 'useIncoming'>]?: IEntityClass<abstract new (...args: any[]) => TInstance>[K];
};
interface RequiredPKOptions<TInstance extends {}> extends EntityOptions<TInstance> {
    readonly pk: ((value: TInstance, parent?: any, key?: string) => string | undefined) | keyof TInstance;
}
interface IEntityClass<TBase extends Constructor = any> {
    toJSON(): {
        name: string;
        schema: {
            [k: string]: Schema;
        };
        key: string;
    };
    /** Defines nested entities
     *
     * @see https://resthooks.io/rest/api/Entity#schema
     */
    schema: {
        [k: string]: Schema;
    };
    /** Returns the globally unique identifier for the static Entity
     *
     * @see https://resthooks.io/docs/api/Entity#key
     */
    key: string;
    /** Defines indexes to enable lookup by
     *
     * @see https://resthooks.io/rest/api/Entity#indexes
     */
    indexes?: readonly string[] | undefined;
    /**
     * A unique identifier for each Entity
     *
     * @see https://resthooks.io/docs/api/Entity#pk
     * @param [value] POJO of the entity or subset used
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     */
    pk<T extends (abstract new (...args: any[]) => IEntityInstance & InstanceType<TBase>) & IEntityClass & TBase>(this: T, value: Partial<AbstractInstanceType<T>>, parent?: any, key?: string, args?: any[]): string | undefined;
    /** Return true to merge incoming data; false keeps existing entity
     *
     * @see https://resthooks.io/docs/api/schema.Entity#useIncoming
     */
    useIncoming(existingMeta: {
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): boolean;
    /** Determines the order of incoming entity vs entity already in store\
     *
     * @see https://resthooks.io/docs/api/schema.Entity#shouldReorder
     * @returns true if incoming entity should be first argument of merge()
     */
    shouldReorder(existingMeta: {
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): boolean;
    /** Creates new instance copying over defined values of arguments
     *
     * @see https://resthooks.io/docs/api/schema.Entity#merge
     */
    merge(existing: any, incoming: any): any;
    /** Run when an existing entity is found in the store
     *
     * @see https://resthooks.io/docs/api/schema.Entity#mergeWithStore
     */
    mergeWithStore(existingMeta: {
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): any;
    /** Run when an existing entity is found in the store
     *
     * @see https://resthooks.io/docs/api/schema.Entity#mergeMetaWithStore
     */
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
    /** Factory method to convert from Plain JS Objects.
     *
     * @param [props] Plain Object of properties to assign.
     */
    fromJS<T extends (abstract new (...args: any[]) => IEntityInstance & InstanceType<TBase>) & IEntityClass & TBase>(this: T, props?: Partial<AbstractInstanceType<T>>): AbstractInstanceType<T>;
    /** Called when denormalizing an entity to create an instance when 'valid'
     *
     * @param [props] Plain Object of properties to assign.
     * @see https://resthooks.io/docs/api/Entity#createIfValid
     */
    createIfValid<T extends (abstract new (...args: any[]) => IEntityInstance & InstanceType<TBase>) & IEntityClass & TBase>(this: T, props: Partial<AbstractInstanceType<T>>): AbstractInstanceType<T> | undefined;
    /** Do any transformations when first receiving input
     *
     * @see https://resthooks.io/docs/api/Entity#process
     */
    process(input: any, parent: any, key: string | undefined): any;
    normalize(input: any, parent: any, key: string | undefined, visit: (...args: any) => any, addEntity: (...args: any) => any, visitedEntities: Record<string, any>): any;
    /** Do any transformations when first receiving input
     *
     * @see https://resthooks.io/docs/api/Entity#validate
     */
    validate(processedEntity: any): string | undefined;
    /** Attempts to infer results
     *
     * @see https://resthooks.io/docs/api/Entity#infer
     */
    infer(args: readonly any[], indexes: NormalizedIndex, recurse: any): any;
    denormalize<T extends (abstract new (...args: any[]) => IEntityInstance & InstanceType<TBase>) & IEntityClass & TBase>(this: T, input: any, unvisit: UnvisitFunction): [denormalized: AbstractInstanceType<T>, found: boolean, suspend: boolean];
    denormalizeOnly<T extends (abstract new (...args: any[]) => IEntityInstance & InstanceType<TBase>) & IEntityClass & TBase>(this: T, input: any, unvisit: (input: any, schema: any) => any): AbstractInstanceType<T>;
    /** All instance defaults set */
    readonly defaults: any;
}
interface IEntityInstance {
    /**
     * A unique identifier for each Entity
     *
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     */
    pk(parent?: any, key?: string, args?: readonly any[]): string | undefined;
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
    storeEntities: any,
    args?: any[],
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

  denormalizeOnly(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): AbstractInstanceType<Choices[keyof Choices]>;

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
    storeEntities: any,
    args?: any[],
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

  denormalizeOnly(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): Record<
    string,
    Choices extends EntityMap<infer T> ? T : Denormalize<Choices>
  >;

  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
  ): any;
}

/**
 * Entities but for Arrays instead of classes
 * @see https://resthooks.io/rest/api/Collection
 */
declare class CollectionInterface<
  S extends PolymorphicInterface = any,
  Parent extends any[] = any,
> {
  addWith<P extends any[] = Parent>(
    merge: (existing: any, incoming: any) => any,
    createCollectionFilter?: (
      ...args: P
    ) => (collectionKey: Record<string, any>) => boolean,
  ): Collection<S, P>;

  readonly schema: S;
  key: string;
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

  push: S extends { denormalizeOnly(): any[] } ? Collection<S, Parent> : never;
  unshift: S extends { denormalizeOnly(): any[] }
    ? Collection<S, Parent>
    : never;

  assign: S extends { denormalizeOnly(): Record<string, unknown> }
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
    options: CollectionOptions,
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

type StrategyFunction<T> = (value: any, parent: any, key: string) => T;
type SchemaFunction<K = string> = (
  value: any,
  parent: any,
  key: string,
) => K;
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
interface SchemaClass$1<T = any, N = T | undefined>
  extends SchemaSimple<T> {
  // this is not an actual member, but is needed for the recursive NormalizeNullable<> type algo
  _normalizeNullable(): any;
  // this is not an actual member, but is needed for the recursive DenormalizeNullable<> type algo
  _denormalizeNullable(): [N, boolean, boolean];
}

// id is in Instance, so we default to that as pk
/**
 * Represents data that should be deduped by specifying a primary key.
 * @see https://resthooks.io/docs/api/schema.Entity
 */
declare function Entity$1<TBase extends PKClass>(
  Base: TBase,
  opt?: EntityOptions<InstanceType<TBase>>,
): IEntityClass<TBase> & TBase;

// id is in Instance, so we default to that as pk
declare function Entity$1<TBase extends IDClass>(
  Base: TBase,
  opt?: EntityOptions<InstanceType<TBase>>,
): IEntityClass<TBase> & TBase & (new (...args: any[]) => IEntityInstance);

// pk was specified in options, so we don't need to redefine
declare function Entity$1<TBase extends Constructor>(
  Base: TBase,
  opt: RequiredPKOptions<InstanceType<TBase>>,
): IEntityClass<TBase> & TBase & (new (...args: any[]) => IEntityInstance);

type schema_d_Delete<E extends EntityInterface & {
    process: any;
}> = Delete<E>;
declare const schema_d_Delete: typeof Delete;
type schema_d_EntityMap<T = any> = EntityMap<T>;
type schema_d_Invalidate<E extends EntityInterface & {
    process: any;
}> = Invalidate<E>;
declare const schema_d_Invalidate: typeof Invalidate;
type schema_d_UnvisitFunction = UnvisitFunction;
type schema_d_All<S extends EntityMap | EntityInterface = EntityMap | EntityInterface> = All<S>;
declare const schema_d_All: typeof All;
type schema_d_Union<Choices extends EntityMap = any> = Union<Choices>;
declare const schema_d_Union: typeof Union;
type schema_d_Values<Choices extends Schema = any> = Values<Choices>;
declare const schema_d_Values: typeof Values;
type schema_d_CollectionInterface<S extends PolymorphicInterface = any, Parent extends any[] = any> = CollectionInterface<S, Parent>;
declare const schema_d_CollectionInterface: typeof CollectionInterface;
type schema_d_CollectionFromSchema<S extends any[] | PolymorphicInterface = any, Parent extends any[] = [
    urlParams: Record<string, any>,
    body?: Record<string, any>,
  ]> = CollectionFromSchema<S, Parent>;
type schema_d_CollectionConstructor = CollectionConstructor;
declare const schema_d_CollectionRoot: typeof CollectionRoot;
type schema_d_Collection<S extends any[] | PolymorphicInterface = any, Parent extends any[] = [
    urlParams: Record<string, any>,
    body?: Record<string, any>,
  ]> = Collection<S, Parent>;
declare const schema_d_Collection: typeof Collection;
type schema_d_StrategyFunction<T> = StrategyFunction<T>;
type schema_d_SchemaFunction<K = string> = SchemaFunction<K>;
type schema_d_MergeFunction = MergeFunction;
type schema_d_SchemaAttributeFunction<S extends Schema> = SchemaAttributeFunction<S>;
type schema_d_UnionResult<Choices extends EntityMap> = UnionResult<Choices>;
type schema_d_EntityInterface<T = any> = EntityInterface<T>;
declare namespace schema_d {
  export {
    schema_d_Delete as Delete,
    schema_d_EntityMap as EntityMap,
    schema_d_Invalidate as Invalidate,
    schema_d_UnvisitFunction as UnvisitFunction,
    Array$1 as Array,
    schema_d_All as All,
    Object$1 as Object,
    schema_d_Union as Union,
    schema_d_Values as Values,
    schema_d_CollectionInterface as CollectionInterface,
    schema_d_CollectionFromSchema as CollectionFromSchema,
    schema_d_CollectionConstructor as CollectionConstructor,
    schema_d_CollectionRoot as CollectionRoot,
    schema_d_Collection as Collection,
    schema_d_StrategyFunction as StrategyFunction,
    schema_d_SchemaFunction as SchemaFunction,
    schema_d_MergeFunction as MergeFunction,
    schema_d_SchemaAttributeFunction as SchemaAttributeFunction,
    schema_d_UnionResult as UnionResult,
    SchemaClass$1 as SchemaClass,
    Entity$1 as Entity,
    schema_d_EntityInterface as EntityInterface,
  };
}

interface NetworkError extends Error {
    status: number;
    response?: Response;
}
interface UnknownError extends Error {
    status?: unknown;
    response?: unknown;
}
type ErrorTypes = NetworkError | UnknownError;

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

/** Get the Params type for a given Shape */
type EndpointParam<E> = E extends (first: infer A, ...rest: any) => any ? A : E extends {
    key: (first: infer A, ...rest: any) => any;
} ? A : never;
/** What the function's promise resolves to */
type ResolveType<E extends (...args: any) => any> = ReturnType<E> extends Promise<infer R> ? R : never;
type PartialParameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? Partial<P> : never;

type FetchFunction<A extends readonly any[] = any, R = any> = (...args: A) => Promise<R>;
/** @deprecated */
type SchemaDetail<T> = EntityInterface<T> | {
    [K: string]: any;
} | SchemaClass$1;
/** @deprecated */
type SchemaList<T> = EntityInterface<T>[] | {
    [K: string]: any;
} | Schema[] | SchemaClass$1;
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
    /** Enables optimistic updates for this request - uses return value as assumed network response
     * @deprecated use https://resthooks.io/docs/api/Endpoint#getoptimisticresponse instead
     */
    optimisticUpdate?(...args: Parameters<F>): ResolveType<F>;
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
interface SchemaClass<T = any, N = T | undefined> extends SchemaSimple<T> {
    _normalizeNullable(): any;
    _denormalizeNullable(): [N, boolean, boolean];
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
/** To change values on the server */
interface MutateEndpoint<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined> extends EndpointInterface<F, S, true> {
    sideEffect: true;
}
/** For retrieval requests */
type ReadEndpoint<F extends FetchFunction = FetchFunction, S extends Schema | undefined = Schema | undefined> = EndpointInterface<F, S, undefined>;

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

declare const Entity_base: IEntityClass<abstract new (...args: any[]) => {
    pk(parent?: any, key?: string | undefined, args?: readonly any[] | undefined): string | undefined;
}> & (abstract new (...args: any[]) => {
    pk(parent?: any, key?: string | undefined, args?: readonly any[] | undefined): string | undefined;
});
/**
 * Represents data that should be deduped by specifying a primary key.
 * @see https://resthooks.io/docs/api/Entity
 */
declare abstract class Entity extends Entity_base {
    /**
     * A unique identifier for each Entity
     *
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     */
    abstract pk(parent?: any, key?: string, args?: readonly any[]): string | undefined;
    /** Control how automatic schema validation is handled
     *
     * `undefined`: Defaults - throw error in worst offense
     * 'warn': only ever warn
     * 'silent': Don't bother with processing at all
     *
     * Note: this only applies to non-nested members.
     */
    protected static automaticValidation?: 'warn' | 'silent';
    /** Return true to merge incoming data; false keeps existing entity
     *
     * @see https://resthooks.io/docs/api/schema.Entity#useIncoming
     */
    static useIncoming(existingMeta: {
        date: number;
        fetchedAt: number;
    }, incomingMeta: {
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): boolean;
    /** Run when an existing entity is found in the store */
    static mergeWithStore(existingMeta: {
        date: number;
        fetchedAt: number;
    } | undefined, incomingMeta: {
        date: number;
        fetchedAt: number;
    }, existing: any, incoming: any): any;
    static mergeMetaWithStore(existingMeta: {
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
    /** Factory method to convert from Plain JS Objects.
     *
     * @param [props] Plain Object of properties to assign.
     */
    static fromJS: <T extends typeof Entity>(this: T, props?: Partial<AbstractInstanceType<T>>) => AbstractInstanceType<T>;
    /**
     * A unique identifier for each Entity
     *
     * @param [value] POJO of the entity or subset used
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     */
    static pk: <T extends typeof Entity>(this: T, value: Partial<AbstractInstanceType<T>>, parent?: any, key?: string, args?: any[]) => string | undefined;
    /** Do any transformations when first receiving input */
    static process(input: any, parent: any, key: string | undefined): any;
    static validate(processedEntity: any): string | undefined;
    static denormalize<T extends typeof Entity>(this: T, input: any, unvisit: UnvisitFunction): [denormalized: AbstractInstanceType<T>, found: boolean, suspend: boolean];
    /** Used by denormalize to set nested members */
    protected static set?(entity: any, key: string, value: any): void;
}

declare function validateRequired(processedEntity: any, requiredDefaults: Record<string, unknown>): string | undefined;

declare const DELETED: unique symbol;
declare const INVALID: symbol;

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
type ArrayElement<ArrayType extends unknown[] | readonly unknown[]> = ArrayType[number];
type IndexParams<S extends Schema> = S extends {
    indexes: readonly string[];
} ? {
    [K in Extract<ArrayElement<S['indexes']>, keyof AbstractInstanceType<S>>]?: AbstractInstanceType<S>[K];
} : Readonly<object>;

/**
 * Programmatic cache reading
 * @see https://resthooks.io/rest/api/Query
 */
declare class Query<S extends SchemaSimple, P extends any[] = [], R = Denormalize<S>> {
    schema: QuerySchema<S, R>;
    process: (entries: Denormalize<S>, ...args: P) => R;
    readonly sideEffect: undefined;
    constructor(schema: S, process?: (entries: Denormalize<S>, ...args: P) => R);
    key(...args: P): string;
    protected createQuerySchema(schema: SchemaSimple): any;
}
type QuerySchema<Schema, R> = Exclude<Schema, 'denormalize' | '_denormalizeNullable'> & {
    denormalize(input: {}, unvisit: UnvisitFunction): [denormalized: R, found: boolean, suspend: boolean];
    _denormalizeNullable(input: {}, unvisit: UnvisitFunction): [denormalized: R | undefined, found: boolean, suspend: boolean];
    denormalizeOnly(input: {}, args: readonly any[], unvisit: (input: any, schema: any) => any): R;
};

declare class AbortOptimistic extends Error {
}

export { AbortOptimistic, AbstractInstanceType, ArrayElement, CollectionFromSchema, CollectionInterface, DELETED, Denormalize, DenormalizeNullable, Endpoint, EndpointExtendOptions, EndpointExtraOptions, EndpointInstance, EndpointInstanceInterface, EndpointInterface, EndpointOptions, EndpointParam, Entity, ErrorTypes, ExpiryStatusInterface, ExtendableEndpoint, FetchFunction, INVALID, Index, IndexParams, KeyofEndpointInstance, MutateEndpoint, NetworkError, Normalize, NormalizeNullable, PolymorphicInterface, Query, ReadEndpoint, ResolveType, Schema, SchemaClass, SchemaDetail, SchemaList, SchemaSimple, SchemaSimpleNew, SnapshotInterface, UnknownError, schema_d as schema, validateRequired };
