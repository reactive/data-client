import type { schema, Collection } from './index.js';
import type {
  SchemaSimple,
  Schema,
  PolymorphicInterface,
  INormalizeDelegate,
} from './interface.js';
import type { EntityMap } from './normal.js';
import { CollectionOptions } from './schemas/Collection.js';
import { default as Invalidate } from './schemas/Invalidate.js';

export { EntityMap, Invalidate };

export { EntityInterface } from './interface.js';

/** Schema when adding to an Array Collection
 * Conceptually only returns a single item
 */
export type CollectionArrayAdder<S extends PolymorphicInterface> =
  S extends (
    {
      // ensure we are an array type
      denormalize(...args: any): any[];
      // get what we are an array of
      schema: infer T;
    }
  ) ?
    // TODO: eventually we want to allow singular or list and infer the return based on arguments
    T
  : never;

/** Schema to remove/move (by value) from a Collection(Array|Values)
 * Conceptually only returns a single item
 */
export type CollectionArrayOrValuesAdder<S extends PolymorphicInterface> =
  S extends (
    {
      denormalize(...args: any): any;
      // get what we are a record of
      schema: infer T;
    }
  ) ?
    T
  : never;

export interface CollectionInterface<
  S extends PolymorphicInterface = any,
  Args extends any[] = any[],
  Parent = any,
> {
  /** Constructs a custom creation schema for this collection
   *
   * @see https://dataclient.io/rest/api/Collection#addWith
   */
  addWith<P extends any[] = Args>(
    merge: (existing: any, incoming: any) => any,
    createCollectionFilter?: (
      ...args: P
    ) => (collectionKey: Record<string, string>) => boolean,
  ): Collection<S, P>;

  readonly cacheWith: object;

  readonly schema: S;
  readonly key: string;

  /**
   * A unique identifier for each Collection
   *
   * Calls argsKey or nestKey depending on which are specified, and then serializes the result for the pk string.
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   * @param [args] ...args sent to Endpoint
   * @see https://dataclient.io/docs/api/Collection#pk
   */
  pk(value: any, parent: any, key: string, args: any[]): string;
  normalize(
    input: any,
    parent: Parent,
    key: string,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): string;

  /** Creates new instance copying over defined values of arguments
   *
   * @see https://dataclient.io/docs/api/Collection#merge
   */
  merge(existing: any, incoming: any): any;

  /** Determines the order of incoming Collection vs Collection already in store
   *
   * @see https://dataclient.io/docs/api/Collection#shouldReorder
   * @returns true if incoming Collection should be first argument of merge()
   */
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

  /** Run when an existing Collection is found in the store
   *
   * @see https://dataclient.io/docs/api/Collection#mergeWithStore
   */
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

  /** Builds a key access the Collection without endpoint results
   *
   * @see https://dataclient.io/rest/api/Collection#queryKey
   */
  queryKey(args: Args, unvisit: unknown, delegate: unknown): any;

  createIfValid: (value: any) => any | undefined;
  denormalize(
    input: any,
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): ReturnType<S['denormalize']>;

  _denormalizeNullable(): ReturnType<S['_denormalizeNullable']>;
  _normalizeNullable(): ReturnType<S['_normalizeNullable']>;

  /** Schema to place at the *end* of this Collection
   * @see https://dataclient.io/rest/api/Collection#push
   */
  push: CollectionArrayAdder<S>;

  /** Schema to place at the *beginning* of this Collection
   * @see https://dataclient.io/rest/api/Collection#unshift
   */
  unshift: CollectionArrayAdder<S>;

  /** Schema to merge with a Values Collection
   * @see https://dataclient.io/rest/api/Collection#assign
   */
  assign: S extends { denormalize(...args: any): Record<string, unknown> } ?
    Collection<S, Args, Parent>
  : never;

  /** Schema to remove (by value) from a Collection(Array|Values)
   * @see https://dataclient.io/rest/api/Collection#remove
   */
  remove: CollectionArrayOrValuesAdder<S>;

  /** Schema to move items between Collections (remove from old, add to new)
   * @see https://dataclient.io/rest/api/Collection#move
   */
  move: CollectionArrayOrValuesAdder<S>;
}
export type CollectionFromSchema<
  S extends any[] | PolymorphicInterface = any,
  Args extends any[] = DefaultArgs,
  Parent = any,
> = CollectionInterface<
  S extends any[] ? schema.Array<S[number]> : S,
  Args,
  Parent
>;

export interface CollectionConstructor {
  /**
   * Entities but for Arrays instead of classes
   * @see https://dataclient.io/rest/api/Collection
   */
  new <
    S extends SchemaSimple[] | PolymorphicInterface = any,
    Args extends any[] = DefaultArgs,
    Parent = any,
  >(
    schema: S,
    options?: CollectionOptions<Args, Parent>,
  ): CollectionFromSchema<S, Args, Parent>;
  readonly prototype: CollectionInterface;
}

export type StrategyFunction<T> = (value: any, parent: any, key: string) => T;
export type SchemaFunction<K = string, Args = any> = (
  value: Args,
  parent: any,
  key: string,
) => K;
export type MergeFunction = (entityA: any, entityB: any) => any;
export type SchemaAttributeFunction<S extends Schema> = (
  value: any,
  parent: any,
  key: string,
) => S;
export type UnionResult<Choices extends EntityMap> = {
  id: string;
  schema: keyof Choices;
};
export type DefaultArgs =
  | []
  | [urlParams: Record<string, any>]
  | [urlParams: Record<string, any>, body: any];
