import { AbstractInstanceType, Denormalize, EntityMap } from './normal.js';
import type { EndpointExtraOptions, FetchFunction } from './types.js';

export * from './SnapshotInterface.js';

export type Schema =
  | null
  | string
  | { [K: string]: any }
  | Schema[]
  | SchemaSimple
  | Serializable;

export type Serializable<
  T extends { toJSON(): string } = { toJSON(): string },
> = {
  prototype: T;
};

export interface SchemaSimple<T = any> {
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
    // eslint-disable-next-line @typescript-eslint/ban-types
    input: {},
    unvisit: UnvisitFunction,
  ): [denormalized: T, found: boolean, suspend: boolean];
  denormalizeOnly?(
    input: {},
    args: any,
    unvisit: (input: any, schema: any) => any,
  ): T;
  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
    entities: EntityTable,
  ): any;
}

export interface SchemaSimpleNew<T = any> {
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
    storeEntities: any,
    args?: any[],
  ): any;
  denormalizeOnly(
    input: {},
    args: readonly any[],
    unvisit: (input: any, schema: any) => any,
  ): T;
  infer(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
    entities: EntityTable,
  ): any;
}

export interface SchemaClass<T = any, N = T | undefined>
  extends SchemaSimple<T> {
  // this is not an actual member, but is needed for the recursive NormalizeNullable<> type algo
  _normalizeNullable(): any;
  // this is not an actual member, but is needed for the recursive DenormalizeNullable<> type algo
  _denormalizeNullable(): [N, boolean, boolean];
}

export interface EntityInterface<T = any> extends SchemaSimple {
  createIfValid?(props: any): any;
  pk(params: any, parent?: any, key?: string, args?: any[]): string | undefined;
  readonly key: string;
  merge(existing: any, incoming: any): any;
  expiresAt?(meta: any, input: any): number;
  mergeWithStore?(
    existingMeta: any,
    incomingMeta: any,
    existing: any,
    incoming: any,
  ): any;
  mergeMetaWithStore?(
    existingMeta: any,
    incomingMeta: any,
    existing: any,
    incoming: any,
  ): any;
  // TODO(breaking): deprecate this
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

/** Represents Array or Values */
export interface PolymorphicInterface<T = any> extends SchemaSimpleNew<T> {
  readonly schema: any;
  // this is not an actual member, but is needed for the recursive NormalizeNullable<> type algo
  _normalizeNullable(): any;
  // this is not an actual member, but is needed for the recursive DenormalizeNullable<> type algo
  _denormalizeNullable(): [any, boolean, boolean];
}

export interface UnvisitFunction {
  (input: any, schema: any): [any, boolean, boolean] | any;
  og?: UnvisitFunction;
  setLocal?: (entity: any) => void;
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

/** Defines a networking endpoint */
export interface EndpointInterface<
  F extends FetchFunction = FetchFunction,
  S extends Schema | undefined = Schema | undefined,
  M extends true | undefined = true | undefined,
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
