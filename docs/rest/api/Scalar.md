---
title: Scalar Schema - Lens-dependent entity fields
sidebar_label: Scalar
---

# Scalar

`Scalar` handles entity fields whose values depend on a "lens" selection, such as viewing
portfolio-specific data for companies. Multiple components can render the same entity through
different lenses simultaneously, each seeing the correct values.

Data is stored in an internal `ScalarCell` entity table and joined at denormalize time based
on endpoint args. The parent entity stores lens-independent references, so switching lenses
never mutates the entity itself.

## Usage

```typescript
import { Entity, Scalar, schema } from '@data-client/rest';

const PortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
});

class Company extends Entity {
  id = '';
  price = 0;
  pct_equity = 0;
  shares = 0;

  static schema = {
    pct_equity: PortfolioScalar,
    shares: PortfolioScalar,
  };
}
```

### Full entity endpoint

When fetching companies with a portfolio lens, scalar fields are automatically extracted
and stored in the `ScalarCell` table:

```typescript
import { Endpoint } from '@data-client/rest';

const getCompanies = new Endpoint(
  ({ portfolio }: { portfolio: string }) =>
    fetch(`/companies?portfolio=${portfolio}`).then(r => r.json()),
  { schema: [Company] },
);
```

### Column-only endpoint

Fetch just the lens-dependent columns without refetching entity data. The response is a
dictionary keyed by entity pk:

```typescript
const getPortfolioColumns = new Endpoint(
  ({ portfolio }: { portfolio: string }) =>
    fetch(`/companies/columns?portfolio=${portfolio}`).then(r => r.json()),
  { schema: new schema.Values(PortfolioScalar) },
);
// Response: { '1': { pct_equity: 0.5, shares: 32342 }, '2': { ... } }
```

Column fetches only write `ScalarCell` entries — they never modify the `Company` entities.

## Constructor

```typescript
new Scalar({ lens, key })
```

### Options

- **`lens`** **(args: readonly any[]) => string | undefined** — **required**. Extracts the lens
  value (e.g. portfolio ID) from endpoint args.
- **`key`** **string** — **required**. A unique name for this scalar type, used to namespace
  the internal `ScalarCell` entity table (e.g. `'portfolio'`).

## How it works

### Normalize

When an entity with `Scalar` schema fields is normalized:

1. `EntityMixin.normalize` detects `Scalar` fields and passes the whole entity object to
   `Scalar.normalize` (avoiding the primitive short-circuit in `getVisit`).
2. `Scalar.normalize` discovers its fields from the parent entity's schema, extracts their
   values, and stores them as a grouped cell via `delegate.mergeEntity(ScalarCell, compoundPk, cellData)`.
3. A lens-independent wrapper `{ id: entityPk, field: fieldName }` replaces each scalar field
   on the entity (similar to how [Union](./Union.md) stores `{ id, schema }` wrappers).

### Denormalize

The standard `EntityMixin.denormalize` loop is **completely unchanged**:

1. `unvisit(Scalar, wrapper)` calls `Scalar.denormalize` (Scalar is not entity-like).
2. `Scalar.denormalize` reads the wrapper, adds the current lens from endpoint `args`, and
   builds the compound pk.
3. It calls `unvisit(ScalarCell, compoundPk)` to look up the correct cell, then extracts and
   returns the specific field value.

This means different components viewing the same entity with different lens args get different
scalar values, while sharing the same base entity data.

## Normalized storage

```
entities['Company']['1'] = {
  id: '1',
  price: 100,
  pct_equity: { id: '1', field: 'pct_equity' },
  shares: { id: '1', field: 'shares' },
}

entities['ScalarCell(portfolio)']['Company|1|portfolioA'] = {
  pct_equity: 0.5,
  shares: 32342,
}

entities['ScalarCell(portfolio)']['Company|1|portfolioB'] = {
  pct_equity: 0.3,
  shares: 323,
}
```

## Related

- [Entity](/rest/api/Entity) — defines the base entity that scalar fields attach to
- [Values](./Values.md) — used for column-only endpoints (dictionary keyed by entity pk)
- [Union](./Union.md) — similar wrapper pattern for polymorphic entities
