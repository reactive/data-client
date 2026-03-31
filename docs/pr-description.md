# feat(normalizr): Add per-field cycle detection and depth control for denormalization

Fixes [#3822](https://github.com/reactive/data-client/issues/3822)

## Problem

data-client eagerly denormalizes all reachable entities depth-first. With bidirectional relationships (Department → Building → Department → Building), each hop visits a different primary key, so same-PK cycle detection never fires. The traversal recurses through the entire entity graph until the JS call stack overflows.

```
Department #1
  └─ Building #A
    └─ Department #2          ← different PK, no cycle detected
      └─ Building #B
        └─ Department #3
          └─ ...              ← keeps going until stack overflow
```

The existing `maxEntityDepth` on Entity (PR #3823, #3834) mitigates this with a global depth counter, but has issues:

**`maxEntityDepth` doesn't control nesting depth — it controls at what global depth the entity stops resolving.** The docs describe it as "limits entity nesting depth," but it checks the global depth counter, not entity-specific nesting. For example:

```ts
class Department extends Entity {
  static maxEntityDepth = 10; // "10 levels of Department nesting"?
}
```

What a user expects: Department can nest 10 levels deep (parent → parent → ... 10 times).

What actually happens: Department won't resolve if the **global** depth counter is ≥ 10 — regardless of how many of those hops were Department entities. If Department is first encountered at global depth 8 (nested inside Building → Room → Document → ...), it only gets 2 more hops before the limit fires. The same Department encountered at global depth 2 gets 8 hops. The effective nesting depth is unpredictable.

Additional issues:
- The same depth limit applies to all relationship paths regardless of whether they're cyclic or not
- With dense bidirectional graphs (20k+ entities), even moderate limits (12-64) create millions of objects from fan-out at each level
- Depth-limited entities created by `depthLimitEntity` bypass the cache, creating duplicate shallow copies — with real production data, this produces 3.8M uncached copies for 500 entities

This PR removes `maxEntityDepth` from Entity and replaces it with per-field controls that accurately describe their behavior. The hardcoded global `MAX_ENTITY_DEPTH` (64) remains as a safety net.

## Solution

Two per-field schema options that target the actual problems:

### 1. `detectCycles: true` — schema-type cycle detection

Stops when the same entity type appears twice in the current ancestor path. This targets the root cause — bidirectional back-references creating infinite traversal loops.

```ts
class Department extends Entity {
  static schema = {
    buildings: { schema: [Building], detectCycles: true },
  };
}

class Building extends Entity {
  static schema = {
    departments: { schema: [Department], detectCycles: true },
  };
}
```

```
Department #1
  └─ Building #A         ← push "Building" to ancestor set
    └─ Department #2     ← push "Department"
      └─ Building #B     ← "Building" already in set → STOP
```

Why this is better than a global depth counter for bidirectional cycles:
- **Targets the actual problem**: back-references are useful — `Department → Building` and `Building → Department` both resolve, but the cyclic loop `Department → Building → Department → Building → ...` is stopped
- **Adapts to any schema shape**: the depth at which the cycle occurs doesn't matter — it works regardless of how many entity types sit between the two sides of the cycle
- **No magic numbers**: no depth limit to tune as data grows denser or schema changes
- **Performance**: with real production data (20k+ entities, 19,504 in one connected component), `detectCycles` denormalizes 3,000 entities in 2ms vs 17,285ms with `maxEntityDepth: 12`

### 2. `entityDepth: N` — relative depth limit for self-referential fields

For self-referential relationships (parent/children hierarchies) where the entity type repeats legitimately. `detectCycles` would stop these at 1 hop (too aggressive). `entityDepth` provides a relative counter from where the field config is set.

```ts
class Department extends Entity {
  static schema = {
    buildings: { schema: [Building], detectCycles: true },
    parent: { schema: Department, entityDepth: 2 },
    children: { schema: [Department], entityDepth: 3 },
  };
}
```

```
Department #1
  └─ children (entityDepth: 3 starts here)
    └─ Department #2      ← hop 1
      └─ Department #3    ← hop 2
        └─ Department #4  ← hop 3 → STOP
```

Unlike `maxEntityDepth`, `entityDepth` is **relative** — "allow N hops from this field" means the same thing regardless of where the entity sits in the overall tree.

**Limitation**: `entityDepth` is designed for self-referential fields on the same entity. When multiple entities in a traversal chain use `entityDepth` on cross-type relationships, the outermost one controls the subtree. Use `detectCycles` for cross-type relationships.

### 3. Cache-safe depth limiting

Depth-limited entities read from cache (returning fully resolved versions if available) but don't write to cache. This prevents cache poisoning where an entity first encountered deep in one subtree gets cached as a shallow copy and served to top-level consumers that need the fully resolved version.

## Usage

Both options can be combined on the same field. Whichever triggers first wins.

```ts
// Cross-type bidirectional: use detectCycles
class Building extends Entity {
  static schema = {
    departments: { schema: [Department], detectCycles: true },
    rooms: { schema: [Room], detectCycles: true },
    documents: { schema: [Document], detectCycles: true },
  };
}

// Self-referential + cross-type: use both
class Department extends Entity {
  static schema = {
    buildings: { schema: [Building], detectCycles: true },
    rooms: { schema: [Room], detectCycles: true },
    documents: { schema: [Document], detectCycles: true },
    parent: { schema: Department, entityDepth: 2 },
    children: { schema: [Department], entityDepth: 3 },
  };
}
```

## Benchmark

Merged store after loading multiple pages: 47,608 entities, 19,504 in one connected component.

| Approach | 1 entity | 100 entities | 500 entities | 3,000 entities |
|----------|---------|-------------|-------------|---------------|
| No depth control | **Stack overflow** | — | — | — |
| `maxEntityDepth: 12` | 13ms | 701ms | 3,181ms | 17,285ms |
| **`detectCycles`** | **<1ms** | **<1ms** | **<1ms** | **2ms** |

## Why per-field, not per-entity

The decision of when to resolve and when to stop is **relative to the relationship**, not absolute to the entity. The best information for that decision lives at the field level:

- A `buildings` field on Department knows it's a bidirectional back-reference → `detectCycles: true`
- A `children` field on Department knows it's a self-referential hierarchy → `entityDepth: 3`
- A `parent` field on Department knows it's a single hop → `entityDepth: 2`

A global counter on the entity (like `maxEntityDepth`) can't distinguish these — it applies the same limit to all paths. The entity doesn't know whether it's being reached through a cyclic back-reference or a legitimate deep hierarchy. The field does.

## Tests

The test suite ([`Depth.test.ts`](packages/endpoint/src/schemas/__tests__/Depth.test.ts)) proves:

**`detectCycles` is predictable** — the test `"Building at root: resolves Department, stops back-reference"` and `"Building nested 4 levels deep: same result"` show identical behavior whether the Building is accessed directly or through 4 levels of Wrapper entities. A global depth counter would give different results depending on traversal context.

**`entityDepth` does what it says** — the test `"resolves exactly 3 levels of children"` shows Org A → B (hop 1) → C (hop 2) → D (hop 3) → E (depth-limited). Always 3 levels, regardless of where Org A sits in the tree.

## Compatibility

- The global depth safety net (`MAX_ENTITY_DEPTH = 64`) remains as a fallback
- `detectCycles` and `entityDepth` fire before the global safety net check
- Fields without config behave exactly as before
- No changes to normalization — field configs are only read during denormalization
- TypeScript types: `{ schema: S, detectCycles?: boolean, entityDepth?: number }` resolves to `Denormalize<S>`

## Future consideration

The global safety net (`MAX_ENTITY_DEPTH = 64`) could be made configurable at the application level (e.g., via DataProvider) to allow different apps to set their own fallback limit without changing the source.
