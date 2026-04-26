---
title: Lazy Schema - Deferred Relationship Denormalization
sidebar_label: Lazy
---

# Lazy

`Lazy` wraps a schema to skip eager denormalization of relationship fields. During parent entity denormalization, the field retains its raw normalized value (primary keys/IDs). The relationship can then be resolved on demand via [useQuery](/docs/api/useQuery) using the `.query` accessor.

This is useful for:
- **Large bidirectional graphs** that would overflow the call stack during recursive denormalization
- **Performance optimization** by deferring resolution of relationships that aren't always needed
- **Memoization isolation** — changes to lazy entities don't invalidate the parent's denormalized form

## Constructor

```typescript
new Lazy(innerSchema)
```

- `innerSchema`: Any [Schema](/rest/api/schema) — an [Entity](./Entity.md), an array shorthand like `[MyEntity]`, a [Collection](./Collection.md), etc.

## Usage

### Array relationship (most common)

```typescript
import { Entity, Lazy } from '@data-client/rest';

class Building extends Entity {
  id = '';
  name = '';
}

class Department extends Entity {
  id = '';
  name = '';
  buildings: string[] = [];

  static schema = {
    buildings: new Lazy([Building]),
  };
}
```

When a `Department` is denormalized, `dept.buildings` will contain raw primary keys (e.g., `['bldg-1', 'bldg-2']`) instead of resolved `Building` instances.

To resolve the buildings, use [useQuery](/docs/api/useQuery) with the `.query` accessor:

```tsx
function DepartmentBuildings({ dept }: { dept: Department }) {
  // dept.buildings contains raw IDs: ['bldg-1', 'bldg-2']
  const buildings = useQuery(Department.schema.buildings.query, dept.buildings);
  // buildings: Building[] | undefined

  if (!buildings) return null;
  return (
    <ul>
      {buildings.map(b => <li key={b.id}>{b.name}</li>)}
    </ul>
  );
}
```

### Single entity relationship

```typescript
class Department extends Entity {
  id = '';
  name = '';
  mainBuilding = '';

  static schema = {
    mainBuilding: new Lazy(Building),
  };
}
```

```tsx
// dept.mainBuilding is a raw PK string: 'bldg-1'
const building = useQuery(
  Department.schema.mainBuilding.query,
  { id: dept.mainBuilding },
);
```

When the inner schema is an [Entity](./Entity.md) (or any schema with `queryKey`), `LazyQuery` delegates to its `queryKey` — so you pass the same args you'd use to query that entity directly.

### Collection relationship

```typescript
class Department extends Entity {
  id = '';
  static schema = {
    buildings: new Lazy(buildingsCollection),
  };
}
```

```tsx
const buildings = useQuery(
  Department.schema.buildings.query,
  ...collectionArgs,
);
```

## `.query`

Returns a `LazyQuery` instance suitable for [useQuery](/docs/api/useQuery). The `LazyQuery`:

- **`queryKey(args)`** — If the inner schema has a `queryKey` (Entity, Collection, etc.), delegates to it. Otherwise returns `args[0]` directly (for array/object schemas where you pass the raw normalized value).
- **`denormalize(input, delegate)`** — Delegates to the inner schema, resolving IDs into full entity instances.

The `.query` getter always returns the same instance (cached).

## How it works

### Normalization

`Lazy.normalize` delegates to the inner schema. Entities are stored in the normalized entity tables as usual — `Lazy` has no effect on normalization.

### Denormalization (parent path)

`Lazy.denormalize` is a **no-op** — it returns the input unchanged. When `EntityMixin.denormalize` iterates over schema fields and encounters a `Lazy` field, the `unvisit` dispatch calls `Lazy.denormalize`, which simply passes through the raw PKs. No nested entities are visited, no dependencies are registered in the cache.

### Denormalization (useQuery path)

When using `useQuery(lazyField.query, ...)`, `LazyQuery.denormalize` delegates to the inner schema via `unvisit`, resolving IDs into full entity instances through the normal denormalization pipeline. This runs in its own `MemoCache.query()` scope with independent dependency tracking and GC.

## Performance characteristics

- **Parent denormalization**: Fewer dependency hops (lazy entities excluded from deps). Faster cache hits. No invalidation when lazy entities change.
- **useQuery access**: Own memo scope with own `paths` and `countRef`. Changes to lazy entities only re-render components that called `useQuery`, not the parent.
- **No Proxy/getter overhead**: Raw IDs are plain values. Full resolution only happens through `useQuery`, using the normal denormalization path.
