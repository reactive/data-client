export type Schema =
  | null
  | string
  | { [K: string]: any }
  | Schema[]
  | SchemaSimple
  | Serializable;

export interface Queryable {
  queryKey(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
    entities: EntityTable,
    // Must be non-void
  ): {};
}

export type Serializable<
  T extends { toJSON(): string } = { toJSON(): string },
> = (value: any) => T;

export interface SchemaSimple<T = any, Args extends any[] = any[]> {
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
    storeEntities: any,
    args: any[],
  ): any;
  denormalize(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): T;
  queryKey(
    args: Args,
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
    entities: EntityTable,
  ): any;
}

export interface SchemaClass<
  T = any,
  N = T | undefined,
  Args extends any[] = any[],
> extends SchemaSimple<T, Args> {
  // this is not an actual member, but is needed for the recursive NormalizeNullable<> type algo
  _normalizeNullable(): any;
  // this is not an actual member, but is needed for the recursive DenormalizeNullable<> type algo
  _denormalizeNullable(): N;
}

export interface EntityInterface<T = any> extends SchemaSimple {
  createIfValid(props: any): any;
  pk(
    params: any,
    parent?: any,
    key?: string,
    args?: readonly any[],
  ): string | number | undefined;
  readonly key: string;
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
  indexes?: any;
  schema: Record<string, Schema>;
  cacheWith?: object;
  prototype: T;
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
