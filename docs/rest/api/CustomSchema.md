---
title: Custom Schema - Define data processing protocols
sidebar_label: Custom Schema
description: Interfaces needed to define custom schemas for normalization, denormalization, and query keys.
---

# Custom Schema

Custom schemas participate in normalization, denormalization, and query key
building by implementing the methods normalizr calls while walking a schema tree.

Most applications should prefer built-in schemas like [Entity](./Entity.md),
[Collection](./Collection.md), [Union](./Union.md), and [Values](./Values.md).
Use this page when building your own schema type.

The interfaces below list the properties normalizr itself reads. Schema-specific
APIs, such as reordering hooks on [Collection](./Collection.md), are not included.

## Usage

This custom schema wraps another schema under a `data` field while preserving the
rest of the object.

```ts
import type {
  IDenormalizeDelegate,
  INormalizeDelegate,
} from '@data-client/endpoint';

class DataWrapper {
  constructor(private schema: any) {}

  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    delegate: INormalizeDelegate,
  ) {
    return {
      ...input,
      data: delegate.visit(this.schema, input.data, input, 'data'),
    };
  }

  denormalize(input: any, delegate: IDenormalizeDelegate) {
    return {
      ...input,
      data: delegate.unvisit(this.schema, input.data),
    };
  }
}
```

Use `delegate.visit()` to recursively normalize nested schemas and
`delegate.unvisit()` to recursively denormalize them. `delegate.args` exposes the
endpoint args for the current operation.

## Interfaces

Any object with `normalize()`, `denormalize()`, or `queryKey()` can be used as a
schema node. Plain arrays and objects are also schemas.

```ts
type Schema =
  | null
  | string
  | { [K: string]: any }
  | Schema[]
  | SchemaSimple
  | Serializable;

type Serializable<T extends { toJSON(): string } = { toJSON(): string }> = (
  value: any,
) => T;
```

### SchemaSimple {#schemasimple}

```ts
interface SchemaSimple<T = any, Args extends readonly any[] = any[]> {
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
    queryKey: (...args: any) => any,
    delegate: IQueryDelegate,
  ): any;
}
```

`normalize()` receives the value at the current schema node and returns the
normalized representation stored in the surrounding result. `parentEntity` is the
nearest enclosing entity-like schema, when present. Most custom schemas can
ignore it.

`denormalize()` receives normalized input and returns the denormalized value.

`queryKey()` computes the normalized key used to read from the store without
fetching. It is only needed for schemas that can be read directly with
[useQuery()](/docs/api/useQuery), [Controller.get](/docs/api/Controller#get), or
[schema.Query](./Query.md).

## Normalization delegate

```ts
interface INormalizeDelegate {
  visit: Visit;
  readonly args: readonly any[];
  readonly meta: MetaEntry;
  getEntities(key: string): EntitiesInterface | undefined;
  getEntity: GetEntity;
  mergeEntity(
    schema: Mergeable & { indexes?: any },
    pk: string,
    incomingEntity: any,
  ): void;
  setEntity(
    schema: { key: string; indexes?: any },
    pk: string,
    entity: any,
    meta?: MetaEntry,
  ): void;
  invalidate(schema: { key: string }, pk: string): void;
  checkLoop(key: string, pk: string, input: object): boolean;
}

interface Visit {
  (schema: any, value: any, parent: any, key: any): any;
  creating?: boolean;
}

interface MetaEntry {
  fetchedAt: number;
  date: number;
  expiresAt: number;
}
```

Use `mergeEntity()` when updating an entity-like schema with merge lifecycles. Use
`setEntity()` when the incoming value should overwrite previous normalized data.
Use `invalidate()` when the schema represents an invalid entity result.

## Denormalization delegate

```ts
interface IDenormalizeDelegate {
  unvisit(schema: any, input: any): any;
  readonly args: readonly any[];
  argsKey(fn: (args: readonly any[]) => string | undefined): string | undefined;
}
```

Reading `delegate.args` does not contribute to cache invalidation. If
denormalized output changes based on endpoint args, register that dependency with
`delegate.argsKey(fn)`. The function reference must be stable; define it at module
scope or bind it on the schema instance.

## Query delegate

```ts
interface IQueryDelegate {
  getEntities(key: string): EntitiesInterface | undefined;
  getEntity: GetEntity;
  getIndex: GetIndex;
  INVALID: symbol;
}

interface Queryable<Args extends readonly any[] = readonly any[]> {
  queryKey(
    args: Args,
    queryKey: (...args: any) => any,
    delegate: IQueryDelegate,
  ): {};
}
```

Return `undefined` from `queryKey()` when the schema cannot produce a valid store
key. Return `delegate.INVALID` when a query result should be treated as invalid.

## Store access helpers

```ts
interface EntitiesInterface {
  keys(): IterableIterator<string>;
  entries(): IterableIterator<[string, any]>;
}

interface GetEntity {
  (key: string, pk: string): any;
}

type IndexPath = [key: string, index: string, value: string];

interface GetIndex {
  (...path: IndexPath): string | undefined;
}
```

## Entity-like schemas

Normalizr treats a schema as entity-like when it has a `pk` property.
Entity-like schemas are stored by `key` and primary key, denormalized through
entity caches, and tracked for cycle detection.

```ts
interface EntityInterface<T = any> extends SchemaSimple {
  readonly key: string;
  pk(
    params: any,
    parent: any,
    key: string | undefined,
    args: readonly any[],
  ): string | number | undefined;
  createIfValid(props: any): any;
  schema: Record<string, Schema>;
  prototype: T;
  indexes?: string[];
  cacheWith?: object;
  maxEntityDepth?: number;
}

interface Mergeable {
  key: string;
  merge(existing: any, incoming: any): any;
  mergeWithStore(
    existingMeta: MetaEntry,
    incomingMeta: MetaEntry,
    existing: any,
    incoming: any,
  ): any;
  mergeMetaWithStore(
    existingMeta: MetaEntry,
    incomingMeta: MetaEntry,
    existing: any,
    incoming: any,
  ): MetaEntry;
}
```

`cacheWith` lets multiple schema instances share the same entity cache identity.
`maxEntityDepth` limits recursive denormalization depth for very deep entity
graphs.

## Related

- [Thinking in Schemas](./schema.md)
- [Entity](./Entity.md)
- [Collection](./Collection.md)
- [Scalar](./Scalar.md)
