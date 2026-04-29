import type { EndpointExtraOptions, FetchFunction } from './types.js';

export * from './SnapshotInterface.js';

export type Schema =
  | null
  | string
  | { [K: string]: any }
  | Schema[]
  | SchemaSimple
  | Serializable;

export interface Queryable<Args extends readonly any[] = readonly any[]> {
  queryKey(
    args: Args,
    unvisit: (...args: any) => any,
    delegate: { getEntity: any; getIndex: any },
    // Must be non-void
  ): {};
}

export type Serializable<
  T extends { toJSON(): string } = { toJSON(): string },
> = (value: any) => T;

export interface SchemaSimple<T = any, Args extends readonly any[] = any> {
  /**
   * Normalize a value into entity table form.
   *
   * @param input        The value being normalized.
   * @param parent       The parent object/array/dictionary containing `input`.
   * @param key          The key under which `input` lives on `parent`.
   * @param delegate     Recursive visitor, endpoint args, and store accessors.
   * @param parentEntity Nearest enclosing entity-like schema (one with `pk`),
   *                     tracked automatically by the visit walker. `Scalar`
   *                     uses this to discover its entity binding.
   */
  normalize(
    input: any,
    parent: any,
    key: any,
    delegate: INormalizeDelegate,
    parentEntity?: any,
  ): any;
  denormalize(input: {}, delegate: IDenormalizeDelegate): T;
  queryKey(
    args: Args,
    unvisit: (...args: any) => any,
    delegate: { getEntity: any; getIndex: any },
  ): any;
}

export interface SchemaClass<
  T = any,
  Args extends readonly any[] = any,
> extends SchemaSimple<T, Args> {
  // this is not an actual member, but is needed for the recursive NormalizeNullable<> type algo
  _normalizeNullable(): any;
  // this is not an actual member, but is needed for the recursive DenormalizeNullable<> type algo
  _denormalizeNullable(): any;
}

export interface EntityInterface<T = any> extends SchemaSimple {
  createIfValid(props: any): any;
  pk(
    params: any,
    parent: any,
    key: string | undefined,
    args: any[],
  ): string | number | undefined;
  readonly key: string;
  indexes?: any;
  prototype: T;
}

export interface Mergeable {
  key: string;
  merge(existing: any, incoming: any): any;
  mergeWithStore(
    existingMeta: any,
    incomingMeta: any,
    existing: any,
    incoming: any,
  ): any;
  mergeMetaWithStore(
    existingMeta: any,
    incomingMeta: any,
    existing: any,
    incoming: any,
  ): any;
}

/** Represents Array or Values */
export interface PolymorphicInterface<
  T = any,
  Args extends any[] = any[],
> extends SchemaSimple<T, Args> {
  readonly schema: any;
  schemaKey(): string;
  // this is not an actual member, but is needed for the recursive NormalizeNullable<> type algo
  _normalizeNullable(): any;
  // this is not an actual member, but is needed for the recursive DenormalizeNullable<> type algo
  _denormalizeNullable(): any;
}

export interface NormalizedIndex {
  readonly [entityKey: string]: {
    readonly [indexName: string]: { readonly [lookup: string]: string };
  };
}

export interface EntityTable {
  [entityKey: string]:
    | {
        [pk: string]: unknown;
      }
    | undefined;
}

/**
 * Visits next data + schema while recursively normalizing.
 *
 * @param schema The schema to apply to `value`.
 * @param value  The value being visited.
 * @param parent The parent object/array/dictionary that holds `value`.
 *               Schemas that recurse via `visit` should pass their own
 *               `input` (or the surrounding container) here.
 * @param key    The key under which `value` lives on `parent`.
 *
 * The walker internally tracks the nearest enclosing entity-like schema and
 * forwards it to `schema.normalize` as a trailing `parentEntity` argument —
 * see `SchemaSimple.normalize`.
 */
export interface Visit {
  (schema: any, value: any, parent: any, key: any): any;
  creating?: boolean;
}

/** Used in denormalize. Lookup to find an entity in the store table */
export interface EntityPath {
  key: string;
  pk: string;
}

export type IndexPath = [key: string, index: string, value: string];
export type EntitiesPath = [key: string];

/** Returns true if a circular reference is found */
export interface CheckLoop {
  (entityKey: string, pk: string, input: object): boolean;
}

/** Interface specification for entities state accessor */
export interface EntitiesInterface {
  keys(): IterableIterator<string>;
  entries(): IterableIterator<[string, any]>;
}

/** Get normalized Entity from store */
export interface GetEntity {
  (key: string, pk: string): any;
}
/** Get PK using an Entity Index */
export interface GetIndex {
  /** getIndex('User', 'username', 'ntucker') */
  (...path: IndexPath): string | undefined;
}

/** Accessors to the currently processing state while building query */
export interface IQueryDelegate {
  /** Get all entities for a given schema key */
  getEntities(key: string): EntitiesInterface | undefined;
  /** Gets any previously normalized entity from store */
  getEntity: GetEntity;
  /** Get PK using an Entity Index */
  getIndex: GetIndex;
  /** Return to consider results invalid */
  INVALID: symbol;
}

/** Helpers during schema.denormalize() */
export interface IDenormalizeDelegate {
  /** Recursive denormalize of nested schemas */
  unvisit(schema: any, input: any): any;
  /** Raw endpoint args. Reading this does NOT contribute to cache
   * invalidation — if your output varies with args, register an `argsKey`
   * so the cache buckets correctly. */
  readonly args: readonly any[];
  /** Adds a memoization dimension to the surrounding cache frame.
   * `fn` must be referentially stable (it doubles as the cache path key).
   * Returns `fn(args)` for convenience. */
  argsKey(fn: (args: readonly any[]) => string | undefined): string | undefined;
}

/** Helpers during schema.normalize() */
export interface INormalizeDelegate {
  /** Recursive normalize of nested schemas */
  visit: Visit;
  /** Raw endpoint args for this normalize call */
  readonly args: readonly any[];
  /** Action meta-data for this normalize call */
  readonly meta: { fetchedAt: number; date: number; expiresAt: number };
  /** Get all entities for a given schema key */
  getEntities(key: string): EntitiesInterface | undefined;
  /** Gets any previously normalized entity from store */
  getEntity: GetEntity;
  /** Updates an entity using merge lifecycles when it has previously been set */
  mergeEntity(
    schema: Mergeable & { indexes?: any },
    pk: string,
    incomingEntity: any,
  ): void;
  /** Sets an entity overwriting any previously set values */
  setEntity(
    schema: { key: string; indexes?: any },
    pk: string,
    entity: any,
    meta?: { fetchedAt: number; date: number; expiresAt: number },
  ): void;
  /** Invalidates an entity, potentially triggering suspense */
  invalidate(schema: { key: string }, pk: string): void;
  /** Returns true when we're in a cycle, so we should not continue recursing */
  checkLoop(key: string, pk: string, input: object): boolean;
}

/** Defines a networking endpoint */
export interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends boolean | undefined = boolean | undefined,
> extends EndpointExtraOptions<F> {
  (...args: Parameters<F>): ReturnType<F>;
  key(...args: Parameters<F>): string;
  readonly sideEffect?: M;
  readonly schema?: S;
}

/** To change values on the server */
export interface MutateEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
> extends EndpointInterface<F, S, true> {
  sideEffect: true;
}

/** For retrieval requests */
export type ReadEndpoint<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
> = EndpointInterface<F, S, undefined>;
