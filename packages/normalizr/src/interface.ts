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

export interface SchemaSimple<T = any, Args extends readonly any[] = any[]> {
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

export interface SchemaClass<T = any, Args extends readonly any[] = any[]>
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
    args: readonly any[],
  ): string | number | undefined;
  readonly key: string;
  indexes?: any;
  schema: Record<string, Schema>;
  prototype: T;
  cacheWith?: object;
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
}

/** Used in denormalize. Lookup to find an entity in the store table */
export interface EntityPath {
  key: string;
  pk: string;
}

export type IndexPath = [key: string, index: string, value: string];
export type EntitiesPath = [key: string];
export type QueryPath = IndexPath | [key: string, pk: string] | EntitiesPath;

/** Returns true if a circular reference is found */
export interface CheckLoop {
  (entityKey: string, pk: string, input: object): boolean;
}

/** Get all normalized entities of one type from store */
export interface GetEntities {
  (key: string): { readonly [pk: string]: any } | undefined;
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
  getEntities: GetEntities;
  getEntity: GetEntity;
  getIndex: GetIndex;
  /** Return to consider results invalid */
  INVALID: symbol;
}

/** Helpers during schema.normalize() */
export interface INormalizeDelegate {
  /** Action meta-data for this normalize call */
  readonly meta: { fetchedAt: number; date: number; expiresAt: number };
  /** Get all normalized entities of one type from store */
  getEntities: GetEntities;
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
