---
title: SchemaSimple - Define data processing protocols
sidebar_label: SchemaSimple
description: Build custom schemas for normalization, denormalization, and query keys.
---

# SchemaSimple

`SchemaSimple` is the interface every schema implements. Implement it yourself
to teach `@data-client/rest` how to normalize, denormalize, and query a value
the built-in schemas can't express.

Most apps never need one, so check the
[Schema Overview](/rest/api/schema#schema-overview) first. Reach for a custom
schema only when you need runtime logic the built-ins don't have, such as output
that depends on endpoint args, or bounded traversal of deep entity graphs.

## Usage

This schema stores every translation of a field, then hands components only the
one for the `locale` they asked for:

```typescript
import { Entity, RestEndpoint } from '@data-client/rest';
import type { IDenormalizeDelegate } from '@data-client/rest';

// highlight-next-line
const localeKey = (args: readonly any[]) => args[0]?.locale;

class LocalizedText {
  normalize(input: Record<string, string>) {
    return input;
  }

  denormalize(
    input: Record<string, string>,
    delegate: IDenormalizeDelegate,
  ) {
    // highlight-next-line
    const locale = delegate.argsKey(localeKey) ?? 'en';
    return input[locale] ?? input.en;
  }

  queryKey() {
    return undefined;
  }
}

class Product extends Entity {
  id = '';
  name = '';

  static key = 'Product';
  static schema = {
    name: new LocalizedText(),
  };
}

const getProduct = new RestEndpoint({
  path: '/products/:id',
  searchParams: {} as { locale?: string },
  schema: Product,
});
```

`useSuspense(getProduct, { id: '5', locale: 'fr' })` returns a `Product` whose
`name` is the French string, while the store keeps every locale.

`delegate.argsKey()` tells the cache that the output depends on `locale`, so
switching locales recomputes the value. Reading `delegate.args` directly would
return stale results. The selector must be a stable function reference, so
define it at module scope or once on the schema instance.

## Members

### normalize(input, parent, key, delegate, parentEntity?) {#normalize}

Turns the raw response value at this position into what's stored in the
endpoint result. Call [`delegate.visit()`](#inormalizedelegate) to normalize
nested schemas, rather than calling their methods directly.

```typescript
normalize(input: any, parent: any, key: string | undefined, delegate: INormalizeDelegate) {
  return {
    ...input,
    data: delegate.visit(this.schema, input.data, input, 'data'),
  };
}
```

For a wrapper whose `schema` is `User`, a
`{ data: { id: '5', name: 'Ada' }, requestId: 'abc' }` response is stored as
`{ data: '5', requestId: 'abc' }`, with the `User` in the entity table.

`normalize()` only runs for object input. For a schema without `pk`, primitives
pass through unchanged unless it sets `acceptsPrimitives = true`, so a wrapper
around an entity stores a bare id exactly as the API sent it. (A bare
[Entity](/rest/api/Entity) stores truthy ids as strings, so `5` becomes `'5'`.) `denormalize()` likewise never
receives `null` or `undefined`.

`parentEntity` is the nearest enclosing entity schema (the class whose field
this is), if any. Most schemas ignore it; [Scalar](/rest/api/Scalar) uses it to
find its entity binding.

### denormalize(input, delegate) {#denormalize}

Receives what `normalize()` returned and builds the value that hooks and
[Controller](/docs/api/Controller) return. Call
[`delegate.unvisit()`](#idenormalizedelegate) for nested schemas.

```typescript
denormalize(input: any, delegate: IDenormalizeDelegate) {
  return {
    ...input,
    data: delegate.unvisit(this.schema, input.data),
  };
}
```

### queryKey(args, unvisit, delegate) {#queryKey}

Builds the normalized value to look up when the schema is read from the store
without fetching, as with [useQuery()](/docs/api/useQuery),
[Controller.get](/docs/api/Controller#get), or [Query](/rest/api/Query). It usually
mirrors the shape `normalize()` returns; `unvisit` asks a nested schema for its
own query key.

```typescript
queryKey(args: readonly any[], unvisit: (schema: any, args: readonly any[]) => any) {
  const data = unvisit(this.schema, args);
  return data === undefined ? undefined : { data };
}
```

Return `undefined` when the store doesn't have enough to answer, and
`delegate.INVALID` when the cached result is known to be invalid.

## Delegates

### INormalizeDelegate {#inormalizedelegate}

Passed to `normalize()`.

| Member                                 | Description                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `visit(schema, value, parent, key)`    | Normalize `value` with a nested schema                                                  |
| `args`                                 | Endpoint args                                                                           |
| `meta`                                 | `{ fetchedAt, date, expiresAt }` of the response                                        |
| `getEntity(key, pk)`                   | Read a stored entity                                                                    |
| `getEntities(key)`                     | Read all stored entities of a type                                                      |
| `mergeEntity(schema, pk, entity)`      | Store an entity through its merge lifecycle                                             |
| `setEntity(schema, pk, entity, meta?)` | Store an entity, replacing what was there                                               |
| `invalidate(schema, pk)`               | Mark an entity invalid, suspending components that need it                              |
| `checkLoop(key, pk, input)`            | `true` when this input was already normalized as (key, pk) in this call; stop recursing |

`getEntity` through `invalidate` are only needed by
[entity-like schemas](#entity-like-schemas).

### IDenormalizeDelegate {#idenormalizedelegate}

Passed to `denormalize()`.

| Member                   | Description                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| `unvisit(schema, input)` | Denormalize `input` with a nested schema                                          |
| `argsKey(fn)`            | Returns `fn(args)` and recomputes the output when that value changes              |
| `args`                   | Endpoint args. Doesn't track changes; use `argsKey()` when output depends on them |

### IQueryDelegate {#iquerydelegate}

Passed to `queryKey()`.

| Member                        | Description                                              |
| ----------------------------- | -------------------------------------------------------- |
| `getEntity(key, pk)`          | Read a stored entity                                     |
| `getEntities(key)`            | Read all stored entities of a type                       |
| `getIndex(key, index, value)` | Find a pk by an [Entity index](/rest/api/Entity#indexes) |
| `INVALID`                     | Return this to mark the result invalid                   |

## Entity-like schemas

Any schema with a `pk` member is treated as an entity: it's stored and memoized
by `key` and pk, deduplicated across cycles, and subject to
[maxEntityDepth](/rest/api/Entity#maxEntityDepth). It must then also provide
`key`, `createIfValid()`, and `denormalize()`. Extend [Entity](/rest/api/Entity)
instead of building this yourself.

## Example: depth-limited relationships

Deep bidirectional graphs (`Department ↔ Building ↔ Room`) make denormalization
expensive. [Lazy](/rest/api/Lazy) is the recommended fix and
[maxEntityDepth](/rest/api/Entity#maxEntityDepth) caps total entity nesting depth;
a custom schema can instead cap traversal per relationship, resolving exactly N
levels.

`DepthLimited` resolves up to `maxDepth` levels of a relationship, then returns
the pks instead. One `delegate` is shared across a whole denormalize call, so a
`WeakMap` keyed on it holds per-call state.

```typescript
import { Entity } from '@data-client/rest';
import type {
  IDenormalizeDelegate,
  INormalizeDelegate,
  Schema,
} from '@data-client/rest';

class DepthLimited<S extends Schema> {
  private readonly _state = new WeakMap<
    IDenormalizeDelegate,
    { depth: number }
  >();

  constructor(
    readonly schema: S,
    readonly maxDepth: number,
  ) {}

  normalize(
    input: any,
    parent: any,
    key: any,
    delegate: INormalizeDelegate,
  ) {
    return delegate.visit(this.schema, input, parent, key);
  }

  denormalize(input: {}, delegate: IDenormalizeDelegate) {
    let cell = this._state.get(delegate);
    if (!cell) {
      cell = { depth: 0 };
      this._state.set(delegate, cell);
    }
    cell.depth++;
    try {
      if (cell.depth > this.maxDepth) return input;
      return delegate.unvisit(this.schema, input);
    } finally {
      cell.depth--;
    }
  }

  queryKey(): undefined {
    return undefined;
  }
}

class Department extends Entity {
  id = '';
  name = '';

  static key = 'Department';
  static schema = {
    children: new DepthLimited([Department], 3),
    parent: new DepthLimited(Department, 1),
  };
}
```

Denormalized entities are memoized per entity, not per depth. An entity first
reached beyond `maxDepth` is cached with that relationship left as pks, and a
later direct read of it from the same store returns that truncated form.

See discussion
[#3828](https://github.com/reactive/data-client/discussions/3828#discussioncomment-16456893)
for a cycle-detecting variant and the tradeoffs versus `Lazy`.

## Related

- [Thinking in Schemas](/rest/api/schema)
- [Entity](/rest/api/Entity)
- [Collection](/rest/api/Collection)
- [Scalar](/rest/api/Scalar)
