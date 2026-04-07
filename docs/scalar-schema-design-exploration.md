# Scalar Schema Design Exploration

## Problem Statement

In a grid/spreadsheet application, each row is an Entity (e.g., `Company`). Some columns display relational data parameterized by a user-selected "lens" entity (e.g., `Portfolio`). When the user switches lenses, the column data changes. This is fundamentally an *intersection table* problem: the data at the intersection of a row entity and a lens entity needs to be a first-class normalized citizen.

**Requirements:**

1. **Cached lens switching** -- switching back to a previously-viewed lens is instant (no refetch)
2. **Incremental merge** -- initial payload carries default-lens data; subsequent lens-change fetches add data without overwriting prior lens data
3. **Type safety** -- `Denormalize<typeof Company>` produces a fully typed `holding` field
4. **Performance** -- O(1) lookup per cell, not O(n) scans

### Why existing primitives fall short

With a plain Entity reference (`static schema = { holding: PortfolioHolding }`), when two lens fetches merge into the same Company entity, `Entity.merge()` (shallow spread) overwrites the `holding` pk reference. After fetching portfolio 456 and then 789, Company stores `holding: '1__789'`. Rendering the 456 view reads from Company, sees `'1__789'`, and returns the wrong holding.

A `Query` with `new All(PortfolioHolding)` can filter to the right holding, but at O(companies x totalHoldings) cost with full table scans -- unacceptable for large grids.

---

## The Four Design Approaches

We explored four distinct architectures for a `Scalar` schema type. Each is a different point in the design space, trading off simplicity, performance, and infrastructure invasiveness.

---

## Approach 1: Entity Subclass with Compound PK + ScalarRef Wrapper

### Core Idea

Scalar extends Entity. Each (row, lens) combination gets its own compound pk (e.g., `'company1__portfolio456'`) and lives as a standard entity in the normalized store. A lightweight `ScalarRef` wrapper sits in the parent Entity's schema to handle the indirection during denormalize.

### Key Innovation

`Scalar.normalize()` stores itself under the compound pk via `delegate.mergeEntity()`, but **returns the row pk** to the parent. Since the row pk is stable across lenses, the parent entity's field value never changes.

### User API

```typescript
class PortfolioHolding extends Scalar {
  percent = 0;
  shares = 0;
  static key = 'PortfolioHolding';
  static row = Company;
  static lens = Portfolio;
  static lensKey = 'portfolioId';
}

class Company extends Entity {
  id = '';
  name = '';
  holding: PortfolioHolding = PortfolioHolding.fromJS();

  static schema = {
    holding: PortfolioHolding.fromLens,  // ScalarRef wrapper
  };
}
```

### Store Layout

```
entities: {
  Company: {
    '1': { id: '1', name: 'ACME', holding: '1' },      // stable row pk
  },
  PortfolioHolding: {
    '1__456': { percent: 42, shares: 100, _rowPk: '1', _lensPk: '456' },
    '1__789': { percent: 15, shares: 50,  _rowPk: '1', _lensPk: '789' },
  },
}
```

### Normalization Flow

1. Company.normalize visits the `holding` field → calls `ScalarRef.normalize()`
2. ScalarRef delegates to `Scalar.normalize()` which:
   - `process()` injects `_rowPk` (from parent) and `_lensPk` (from args)
   - Computes compound pk `'1__456'`
   - `delegate.mergeEntity(PortfolioHolding, '1__456', processedEntity)`
   - **Returns `'1'`** (the row pk, NOT the compound pk)
3. Company stores `holding: '1'` — same value regardless of lens

### Denormalization Flow

1. Company.denormalize encounters `holding: '1'` and calls `unvisit(ScalarRef, '1')`
2. `isEntity(ScalarRef)` → **false** (no pk on ScalarRef) → non-entity path
3. `ScalarRef.denormalize('1', args, unvisit)`:
   - Extracts `lensPk = '456'` from args
   - Constructs compound pk `'1__456'`
   - Calls `unvisit(PortfolioHolding, '1__456')` → entity lookup
4. Returns PortfolioHolding instance for the active lens

### Strengths

- **Zero normalizr changes** -- Works entirely within existing `SchemaSimple` and `EntityInterface` contracts
- **Natural cache behavior** -- Different lens fetches create separate entity entries; old entries are never overwritten
- **Standard Entity lifecycle** -- `merge()`, `shouldUpdate()`, etc. apply normally to Scalar entities
- **Indexable** -- `PortfolioHolding` can declare indexes for cross-lens queries
- **Composable with Query** -- `new Query(new All(PortfolioHolding), ...)` works for aggregations

### Weaknesses

- **Compound pk separator fragility** -- The `'__'` separator must not appear in either component pk
- **ScalarRef indirection** -- Users must use `.fromLens` in schema rather than the class directly
- **`process()` dual context** -- Must handle both nested (row pk from parent) and standalone (row pk from input) contexts
- **Memory growth** -- R rows × L lenses = R*L entities, each with its own `entitiesMeta` entry

---

## Approach 2: Collection-like Non-Entity with Lens Map

### Core Idea

Scalar follows the Collection pattern: NOT an Entity subclass, implements `Mergeable` directly, stored in the entities table. The pk is derived from the parent entity (via `nestKey`). The normalized value is a **map of lens keys to inner values**. Merge **accumulates** lens entries.

### Key Innovation

The merge strategy `{ ...existing, ...incoming }` naturally accumulates lens data across fetches. The parent entity's holding field is a stable pk (from nestKey), so Entity.merge on the parent produces the same field value regardless of lens.

### User API

```typescript
class Company extends Entity {
  id = '';
  name = '';

  static schema = {
    holding: new Scalar(
      { percent: Number, shares: Number },
      {
        nestKey: (parent, key) => ({ companyId: parent.id }),
        argsKey: (params) => ({ portfolioId: params.portfolioId }),
      },
    ),
  };
}
```

### Store Layout

```
entities: {
  Company: {
    '1': { id: '1', name: 'ACME', holding: '{"companyId":"1"}' },
  },
  'Scalar(holding)': {
    '{"companyId":"1"}': {
      '{"portfolioId":"456"}': { percent: 42, shares: 100 },
      '{"portfolioId":"789"}': { percent: 15, shares: 50 },
    },
  },
}
```

### Normalization Flow

1. `Scalar.normalize()` computes pk from `nestKey(parent, key)` → `'{"companyId":"1"}'`
2. Computes lens key from `argsKey(...args)` → `'{"portfolioId":"456"}'`
3. Normalizes inner value through inner schema
4. Stores `{ [lensKey]: normalizedInner }` via `delegate.mergeEntity(this, pk, lensMap)`
5. Returns the stable pk to the parent

### Denormalization Flow

1. `unvisitEntity(Scalar, pk)` retrieves the full lens map from store
2. `Scalar.denormalize(lensMap, args, unvisit)`:
   - Computes lens key from `argsKey(...args)`
   - Extracts `lensMap[lensKey]`
   - Denormalizes inner value through inner schema

### Strengths

- **Collection-consistent patterns** -- Same `Mergeable` + entity-table storage pattern
- **Additive merge** -- `{ ...existing, ...incoming }` naturally accumulates lens data
- **Stable parent references** -- Parent entity field value unaffected by lens switches
- **Inner schema flexibility** -- Works with primitives, plain object schemas, or Entity schemas

### Weaknesses

- **MemoCache lens awareness** -- Denormalized output depends on args, but cache keys on entity object reference. Different args produce different outputs from the same entity → requires cache partitioning
- **Unbounded lens accumulation** -- `merge` never discards old entries
- **nestKey is required** -- No sensible default; user must explicitly provide both `nestKey` and `argsKey`
- **V8 hidden-class polymorphism** -- Lens map grows over time with new properties

---

## Approach 3: Entity with Lens Map Field + `fieldMerge` Protocol

### Core Idea

Store lens data as a map field **on the row entity itself**. Scalar is a schema field type (not an entity) that wraps values in a lens-keyed map during normalize and extracts the active lens value during denormalize. Entity.merge is enhanced with a `fieldMerge` protocol so Scalar fields deep-merge across fetches.

### Key Innovation

A new `fieldMerge` protocol on schema objects allows Entity.merge to delegate field-level merge to the schema. Scalar implements `fieldMerge` as `{ ...existing, ...incoming }`, accumulating lens entries. No new entity table needed.

### User API

```typescript
class Company extends Entity {
  id = '';
  name = '';
  holding = HoldingData.fromJS();

  static schema = {
    holding: new Scalar(HoldingData, {
      lensKey: (args) => args[0]?.portfolioId,
    }),
  };
}
```

### Store Layout

```
entities: {
  Company: {
    '1': {
      id: '1', name: 'ACME',
      holding: {
        '456': { percent: 42, marketValue: 1000 },
        '789': { percent: 15, marketValue: 300 },
      }
    },
  },
}
```

### Normalization Flow

1. Entity.normalize visits `holding` field → calls `Scalar.normalize()`
2. `Scalar.normalize()` extracts lens key from args → `'456'`
3. Returns `{ '456': normalizedValue }` — wraps the value in a lens-keyed map
4. Entity stores this as `processedEntity.holding`
5. On merge, `Entity.merge` calls `Scalar.fieldMerge(existing.holding, incoming.holding)` → `{ ...existing, ...incoming }`, accumulating lens entries

### Denormalization Flow

1. Entity.denormalize visits `holding` field → calls `unvisit(Scalar, fullMap)`
2. `Scalar.denormalize(fullMap, args, unvisit)`:
   - Extracts lens key `'456'` from args
   - Returns `fullMap['456']` denormalized through inner schema

### Strengths

- **Simple mental model** -- All data for a Company stays in one entity row
- **Type-transparent** -- Consumers see `HoldingData`, not `Record<string, HoldingData>`
- **No new entity table** -- No changes to store shape
- **Composable** -- Multiple Scalar fields with different `lensKey` functions on one entity

### Weaknesses

- **Cannot invalidate a single lens** -- Invalidating Company invalidates *all* lens data
- **Entity size grows** -- Each Company accumulates all lens entries
- **Merge complexity** -- Requires modifying `Entity.merge()` to be schema-aware, or user provides custom merge
- **MemoCache interaction** -- Entity POJO changes when any lens is added, invalidating cache for *all* lens views

### fieldMerge Enhancement Strategies

| Strategy | Description | Pros | Cons |
|---|---|---|---|
| **A: `fieldMerge` protocol** | Entity.merge checks schema fields for `fieldMerge` method | General-purpose, declarative | Modifies Entity.merge for ALL entities |
| **B: Pre-merge at normalize time** | Scalar reads existing entity from store during normalize, accumulates | Self-contained | Batch correctness issues with duplicate entities |
| **C: Manual merge override** | User writes custom `Entity.merge()` | Zero framework changes | Boilerplate, error-prone |
| **D: Helper function** | `Scalar.createMerge(schema)` generates the merge function | No Entity changes | User must remember to add it |

**Recommended**: Strategy A with a cached `_hasFieldMerge` flag at class-definition time to avoid per-merge overhead for entities without Scalar fields.

---

## Approach 4: Query-like Wrapper with ScalarNormalizedValue

### Core Idea

Scalar wraps an Entity and stores a `ScalarNormalizedValue` object (containing `pk` + `stableFields`) on the parent entity. During denormalize, it recomputes the desired pk from `stableFields + args`, overriding the stored reference. The inner Entity lives in its own table with full Entity lifecycle.

### Key Innovation

The stored reference is a "hint" — `Scalar.denormalize()` always recomputes the actual pk from stable fields (captured at normalize time) combined with current args. This means the same Company entity can resolve to different PortfolioHolding entries depending on args.

### User API

```typescript
const holdingLens = new Scalar(PortfolioHolding, {
  select: (parent, args) => ({
    companyId: parent.id,
    portfolioId: args[0]?.portfolioId,
  }),
});

class Company extends Entity {
  id = '';
  name = '';
  holding = PortfolioHolding.fromJS();

  static schema = {
    holding: holdingLens,
  };
}
```

### Store Layout

```
entities: {
  Company: {
    '1': {
      id: '1', name: 'ACME',
      holding: { pk: '1__789', stableFields: { companyId: '1' } }
    },
  },
  PortfolioHolding: {
    '1__456': { companyId: '1', portfolioId: '456', percent: 42 },
    '1__789': { companyId: '1', portfolioId: '789', percent: 35 },
  },
}
```

### Normalization Flow

1. `Scalar.normalize()` calls `select(parent, args)` → `{ companyId: '1', portfolioId: '456' }`
2. Enriches input with select result, delegates to `PortfolioHolding.normalize()`
3. Inner entity stored at `entities['PortfolioHolding']['1__456']`
4. Returns `ScalarNormalizedValue { pk: '1__456', stableFields: { companyId: '1' } }`

### Denormalization Flow

1. `Scalar.denormalize({ pk: '1__789', stableFields: { companyId: '1' } }, args, unvisit)`:
   - Takes `stableFields` + lens fields from args → `{ companyId: '1', portfolioId: '456' }`
   - Computes desired pk → `'1__456'`
   - Calls `unvisit(PortfolioHolding, '1__456')` — entity lookup

### Strengths

- **O(1) lens resolution** -- Direct pk computation + entity lookup
- **Full Entity lifecycle** -- Each PortfolioHolding has its own merge/update/expiry
- **Declarative** -- `select` describes the relationship
- **Works with useQuery** -- Scalar can be used as a top-level Queryable

### Weaknesses

- **MemoCache conflict** -- Same Company POJO, different args → different results; cache assumes denormalize is a pure function of entity references
- **Non-string normalized value** -- Breaks the convention that entity field references are pk strings
- **stableFields fragility** -- Captured at normalize time; parent schema changes could make them stale
- **No parent access during denormalize** -- The `SchemaSimple.denormalize` signature doesn't pass parent context, necessitating the stableFields workaround

---

## Comparative Analysis

### Store Layout Comparison

| Approach | Where lens data lives | Parent entity stores |
|---|---|---|
| **1: Entity+Compound PK** | Separate entity table: `PortfolioHolding['1__456']` | Row pk string: `'1'` |
| **2: Collection-like** | Separate entity table: `Scalar(holding)['{"companyId":"1"}']` → lens map | Serialized nestKey: `'{"companyId":"1"}'` |
| **3: Map-inside-Entity** | On the entity itself: `Company['1'].holding` → lens map | Lens map object |
| **4: Query-like Wrapper** | Separate entity table: `PortfolioHolding['1__456']` | ScalarNormalizedValue object |

### Infrastructure Impact

| Approach | Changes to Entity.merge | Changes to normalizr | Changes to MemoCache | New interfaces |
|---|---|---|---|---|
| **1: Entity+Compound PK** | None | None | None | ScalarRef (non-entity SchemaSimple) |
| **2: Collection-like** | None | None | Args-aware cache partitioning | Scalar (Mergeable, similar to Collection) |
| **3: Map-inside-Entity** | `fieldMerge` protocol | None | None (but cache invalidates broadly) | `fieldMerge` on SchemaSimple |
| **4: Query-like Wrapper** | None | None | Args-keyed sub-cache (Option B) | Scalar with ScalarNormalizedValue |

### Performance Characteristics

| Approach | Normalize overhead | Denormalize overhead | Memory per lens value |
|---|---|---|---|
| **1: Entity+Compound PK** | 1 entity write | 1 compound pk construction + 1 entity lookup | 1 entity + 1 meta entry |
| **2: Collection-like** | 1 entity write + lens map merge | 1 lens key computation + 1 property lookup + inner denormalize | Share meta across lenses (1 meta per parent pk) |
| **3: Map-inside-Entity** | 1 map wrap + entity merge with fieldMerge | 1 lens key extraction + inner denormalize | No separate meta; lens data is part of parent entity |
| **4: Query-like Wrapper** | 1 entity write | 1 pk recomputation + 1 entity lookup | 1 entity + 1 meta entry |

### MemoCache Impact

| Approach | Cache correctness without changes | Cache invalidation behavior |
|---|---|---|
| **1: Entity+Compound PK** | **Correct** — ScalarRef resolves to different entity pks which are independently cached | Fine-grained: only the accessed holding entity invalidates |
| **2: Collection-like** | **Incorrect** — same entity object, different args, different output | Requires args-aware cache partitioning |
| **3: Map-inside-Entity** | **Correct but broad** — entity POJO changes when any lens added | Over-invalidates: all lens views re-denormalize when any new lens arrives |
| **4: Query-like Wrapper** | **Incorrect** — same Company POJO, different args, different output | Requires args-keyed sub-cache |

---

## Recommendation

### Primary: Approach 1 (Entity Subclass + ScalarRef)

Approach 1 is the strongest candidate because it requires **zero changes to normalizr internals**, zero changes to Entity.merge, and zero changes to MemoCache. It works entirely within existing contracts.

**Key advantages over the alternatives:**

1. **No MemoCache problem** -- The ScalarRef wrapper produces different entity pks for different lenses. Each pk is independently cached. The standard memoization just works.

2. **Per-lens invalidation** -- Each (row, lens) combination is an independent entity with its own `entitiesMeta`. Individual lens entries can be expired, invalidated, or re-fetched without affecting others.

3. **Full Entity lifecycle** -- merge, shouldUpdate, shouldReorder, validate all apply to individual Scalar entries. This enables fine-grained control.

4. **Existing pattern consistency** -- The ScalarRef wrapper is analogous to Collection's `push`/`unshift` variants. The `.fromLens` accessor follows a similar pattern.

**Mitigations for weaknesses:**

- **Separator fragility**: Use a multi-character separator like `'⊗'` or URL-encode components
- **ScalarRef indirection**: `.fromLens` is discoverable and follows existing patterns (Collection.push)
- **Memory**: R×L entities is the theoretical minimum for caching all combinations. TTL/GC handles eviction naturally.

### Secondary consideration: Hybrid of Approach 1 + Approach 3's fieldMerge

If a `fieldMerge` protocol is added to Entity (from Approach 3), it becomes a general-purpose extension point that benefits many use cases beyond Scalar. It could coexist with Approach 1 — not as the primary lens mechanism, but as an opt-in for cases where storing lens data on the parent entity is simpler (small number of lenses, primitive values).

### Not recommended: Approaches 2 and 4

Both require MemoCache infrastructure changes — the hardest and riskiest modification. Approach 4's `ScalarNormalizedValue` also breaks the string-reference convention. Approach 2's nested lens map has the same cache problem with additional V8 hidden-class concerns.

---

## Open Questions (Across All Approaches)

1. **Multi-lens dimensions**: Can an entity be parameterized by multiple lens dimensions (e.g., Portfolio AND TimePeriod)? Approach 1 generalizes to N dimensions via compound pk: `rowPk__lens1Pk__lens2Pk`.

2. **Lens as non-Entity**: What if the lens dimension is a simple string (date range, category) rather than an Entity? All approaches handle this — the lens key is just a string.

3. **Optimistic updates**: How does `getOptimisticResponse` work? Approach 1 requires constructing the compound pk from mutation args, which should work naturally.

4. **Default lens in initial payload**: The initial load includes a default lens. All approaches handle this as a standard first fetch.

5. **Partial/supplementary endpoints**: A lens-only endpoint (returns just holding data, not full companies) works with Approach 1 by normalizing PortfolioHolding entities directly.

6. **Naming**: `Scalar` vs `Intersection` vs `LensEntity` vs `CrossEntity`. "Scalar" emphasizes single value at an intersection. "Intersection" is more database-relational. Consider discoverability.

7. **Extending denormalize signature**: If `Entity.denormalize` passed parent context to nested schemas, Approaches 2-4 become simpler. This is a potential long-term improvement independent of Scalar.

8. **`fieldMerge` as standalone feature**: Even if Approach 1 is chosen for Scalar, the `fieldMerge` protocol from Approach 3 is independently useful for any schema that needs custom merge behavior within an Entity.
