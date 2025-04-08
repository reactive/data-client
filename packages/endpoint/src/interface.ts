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
  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: (...args: any) => any,
    delegate: { getEntity: any; setEntity: any },
  ): any;
  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): T;
  queryKey(
    args: Args,
    unvisit: (...args: any) => any,
    delegate: { getEntity: any; getIndex: any },
  ): any;
}

export interface SchemaClass<T = any, Args extends readonly any[] = any>
  extends SchemaSimple<T, Args> {
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
export interface PolymorphicInterface<T = any, Args extends any[] = any[]>
  extends SchemaSimple<T, Args> {
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

/** Visits next data + schema while recurisvely normalizing */
export interface Visit {
  (schema: any, value: any, parent: any, key: any, args: readonly any[]): any;
  creating?: boolean;
}

/** Returns true if a circular reference is found */
export interface CheckLoop {
  (entityKey: string, pk: string, input: object): boolean;
}

/** Get Array of entities with map function applied */
export interface GetEntity {
  (entityKey: string | symbol): { readonly [pk: string]: any } | undefined;
  (entityKey: string | symbol, pk: string | number): any;
}
/** Get PK using an Entity Index */
export interface GetIndex {
  /** getIndex('User', 'username', 'ntucker') */
  (entityKey: string, field: string, value: string): string | undefined;
}

/** Accessors to the currently processing state while building query */
export interface IQueryDelegate {
  getEntity: GetEntity;
  getIndex: GetIndex;
  /** Return to consider results invalid */
  INVALID: symbol;
}

/** Helpers during schema.normalize() */
export interface INormalizeDelegate {
  /** Action meta-data for this normalize call */
  readonly meta: { fetchedAt: number; date: number; expiresAt: number };
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
  invalidate(schema: { key: string; indexes?: any }, pk: string): void;
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
