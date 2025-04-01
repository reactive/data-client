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
    delegate: { getEntity: any; addEntity: any },
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
  prototype?: T;
  cacheWith?: object;
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
}

/** Helpers during schema.normalize() */
export interface INormalizeDelegate {
  readonly meta: { fetchedAt: number; date: number; expiresAt: number };
  getEntity: GetEntity;
  getMeta(
    key: string,
    pk: string,
  ): {
    date: number;
    expiresAt: number;
    fetchedAt: number;
  };
  getInProgressEntity(key: string, pk: string): any;
  addEntity(
    schema: EntityInterface,
    pk: string,
    entity: any,
    meta?: { fetchedAt: number; date: number; expiresAt: number },
  ): void;
  checkLoop(entityKey: string, pk: string, input: object): boolean;
}
