---
title: Scalar Schema - Lens-Dependent Entity Fields
sidebar_label: Scalar
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';

# Scalar

`Scalar` handles [Entity](./Entity.md) fields whose values depend on a "lens" selection,
such as portfolio-specific columns on the same company row. Multiple components can render
the same entity through different lenses simultaneously, each seeing the correct values.

Data is stored in an internal `Scalar` entity table and joined at denormalize time based
on endpoint args. The parent entity stores lens-independent references, so switching lenses
never mutates the entity itself.

Use `Scalar` when:

- the field is a scalar value like a number, string, boolean, or date-derived value
- the value belongs to an entity, but varies by request args
- you want to refresh those columns independently from the rest of the entity

Do not use `Scalar` for relationships to other entities; define nested [schemas](./schema.md)
on the entity instead.

## Constructor

```typescript
new Scalar({ lens, key, entity? })
```

### Options

- **`lens`** **(args: readonly any[]) => string | undefined** — **required**. Extracts the
  lens value from endpoint args, such as a portfolio ID. The lens must be present when
  normalizing a response; returning `undefined` during normalize throws because the cell
  cannot be stored under a retrievable key. During denormalize, a missing lens returns
  `undefined` for the scalar field.
- **`key`** **string** — **required**. A unique name for this scalar type, used to namespace
  the internal `Scalar` entity table. For example, `'portfolio'` becomes
  `Scalar(portfolio)`.
- **`entity`** **Entity class** — _optional_. The `Entity` class this `Scalar` attaches to.
  This is only required when the `Scalar` is used standalone, such as inside
  [Values](./Values.md) for a column-only endpoint, where there is no parent entity to
  infer from. When used as a field on `Entity.schema`, the entity is inferred from the
  parent and recorded on the wrapper.

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

A single `Scalar` instance can be shared across multiple `Entity` classes — the
entity context is inferred at normalize time from the parent entity and recorded
on the wrapper, so denormalize always resolves to the correct cell. Compound pks
remain unique because they are namespaced by entity key (e.g.
`Company|1|portfolioA` vs. `Fund|1|portfolioA`).

### Full entity endpoint

When fetching companies with a portfolio lens, scalar fields are automatically extracted
and stored in the `Scalar` cell table:

```typescript
import { Endpoint } from '@data-client/rest';

const getCompanies = new Endpoint(
  ({ portfolio }: { portfolio: string }) =>
    fetch(`/companies?portfolio=${portfolio}`).then(r => r.json()),
  { schema: [Company] },
);
```

### Column-Only Endpoint

Fetch just the lens-dependent columns without refetching entity data. The response is a
dictionary keyed by entity pk. Because there is no parent entity in this path, the `Scalar`
must be **bound** to an `Entity` class via the `entity` option:

```typescript
const CompanyPortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
  entity: Company,
});

const getPortfolioColumns = new Endpoint(
  ({ portfolio }: { portfolio: string }) =>
    fetch(`/companies/columns?portfolio=${portfolio}`).then(r => r.json()),
  { schema: new schema.Values(CompanyPortfolioScalar) },
);
// Response: { '1': { pct_equity: 0.5, shares: 32342 }, '2': { ... } }
```

Column fetches only write `Scalar(portfolio)` cell entries — they never modify the `Company` entities.

A bound `Scalar` can also be used as an `Entity.schema` field (the binding is just ignored
in favor of the inferred parent), so a single instance can serve both endpoints.

### Combined Usage: Portfolio Grid

Both endpoints share a single `Scalar` instance and feed the same grid.
`getCompanies` loads the full row data on first render; `getPortfolioColumns`
fires alongside as a cheaper lens-only refresh — both write to the same
`Scalar(portfolio)` cell table. Switch portfolios in the dropdown to watch
`% Equity` and `Shares` swap while the `Company` rows themselves stay stable.

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/companies', searchParams: {}}),
args: [{ portfolio: 'A' }],
response: [
{ id: '1', name: 'Acme Corp', price: 145.20, pct_equity: 0.50, shares: 10000 },
{ id: '2', name: 'Globex', price: 89.50, pct_equity: 0.20, shares: 4000 },
{ id: '3', name: 'Initech', price: 32.10, pct_equity: 0.10, shares: 2500 },
],
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/companies', searchParams: {}}),
args: [{ portfolio: 'B' }],
response: [
{ id: '1', name: 'Acme Corp', price: 145.20, pct_equity: 0.30, shares: 6000 },
{ id: '2', name: 'Globex', price: 89.50, pct_equity: 0.40, shares: 8000 },
{ id: '3', name: 'Initech', price: 32.10, pct_equity: 0.05, shares: 1200 },
],
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/companies/columns', searchParams: {}}),
args: [{ portfolio: 'A' }],
response: {
'1': { pct_equity: 0.50, shares: 10000 },
'2': { pct_equity: 0.20, shares: 4000 },
'3': { pct_equity: 0.10, shares: 2500 },
},
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/companies/columns', searchParams: {}}),
args: [{ portfolio: 'B' }],
response: {
'1': { pct_equity: 0.30, shares: 6000 },
'2': { pct_equity: 0.40, shares: 8000 },
'3': { pct_equity: 0.05, shares: 1200 },
},
delay: 150,
},
]}>

```ts title="api/Company" {12,17-18,28-32}
import { Entity, RestEndpoint, Scalar, schema } from '@data-client/rest';

export class Company extends Entity {
  id = '';
  name = '';
  price = 0;
  pct_equity = 0;
  shares = 0;
}

// Bound to Company so both endpoints below can use this same instance.
const PortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
  entity: Company,
});
Company.schema = {
  pct_equity: PortfolioScalar,
  shares: PortfolioScalar,
};

export const getCompanies = new RestEndpoint({
  path: '/companies',
  searchParams: {} as { portfolio: string },
  schema: [Company],
});

export const getPortfolioColumns = new RestEndpoint({
  path: '/companies/columns',
  searchParams: {} as { portfolio: string },
  schema: new schema.Values(PortfolioScalar),
});
```

```tsx title="PortfolioGrid"
import { useSuspense, useFetch } from '@data-client/react';
import { getCompanies, getPortfolioColumns } from './api/Company';

function PortfolioGrid() {
  const [portfolio, setPortfolio] = React.useState('A');
  // Full load: Company rows + Scalar cells for the current lens.
  const companies = useSuspense(getCompanies, { portfolio });
  // Cheap lens-only refresh in the background — writes to the same cell table.
  useFetch(getPortfolioColumns, { portfolio });

  return (
    <div>
      <label>
        Portfolio:{' '}
        <select
          value={portfolio}
          onChange={e => setPortfolio(e.currentTarget.value)}
        >
          <option value="A">Portfolio A</option>
          <option value="B">Portfolio B</option>
        </select>
      </label>
      <table style={{ marginTop: 8, width: '100%' }}>
        <thead>
          <tr>
            <th align="left">Name</th>
            <th align="right">Price</th>
            <th align="right">% Equity</th>
            <th align="right">Shares</th>
          </tr>
        </thead>
        <tbody>
          {companies.map(c => (
            <tr key={c.pk()}>
              <td>{c.name}</td>
              <td align="right">${c.price.toFixed(2)}</td>
              <td align="right">{(c.pct_equity * 100).toFixed(1)}%</td>
              <td align="right">{c.shares.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
render(<PortfolioGrid />);
```

</HooksPlayground>

`name` and `price` references stay stable across portfolio switches because
the `Company` entity itself never changes — only the Scalar cell selected by
the current lens does. In a real app, you'd typically reach for
`getPortfolioColumns` instead of `getCompanies` after the initial load to
avoid refetching lens-independent fields.

## How It Works

### Normalize

`EntityMixin.normalize`'s field loop is a single uniform `visit(schema, value, parent, key, args)`
call per field — there is no `Scalar`-specific branch. When the field's schema is a `Scalar`:

1. The visit walker (`getVisit`) tracks the nearest enclosing entity-like schema in a closure and
   passes it to `schema.normalize` as a 7th `parentEntity` argument. `Scalar` opts out of the
   primitive short-circuit via `acceptsPrimitives = true`, so its `normalize` receives the raw
   field value (e.g. `0.5`).
2. `Scalar.normalize` reads `parentEntity.key` / `parentEntity.pk(parent, …, args)` to build the
   compound cell pk (`entityKey|entityPk|lensValue`) and writes just that one field via
   `delegate.mergeEntity(this, compoundPk, { [key]: input })`. The merge lifecycles accumulate
   the per-call writes into a full cell as the loop runs over each scalar field.
3. A lens-independent tuple `[entityPk, fieldName, entityKey]` replaces the scalar field on the
   entity row (an array, distinguishable from cell data via `Array.isArray`).

### Denormalize

The standard `EntityMixin.denormalize` loop is **completely unchanged**:

1. `delegate.unvisit(Scalar, wrapper)` calls `Scalar.denormalize` (Scalar is not entity-like).
2. `Scalar.denormalize` reads the wrapper tuple and calls `delegate.argsKey(this.lensSelector)` —
   this both extracts the current lens from endpoint `args` *and* registers that lens as a
   memoization dimension on the surrounding entity-cache frame, so the cached result varies
   per-lens. The lens selector is bound on the `Scalar` instance so its reference stays stable
   across calls (required for `WeakDependencyMap` to hit).
3. It builds the compound cell pk, calls `delegate.unvisit(this, compoundPk)` to look up the
   cell, then returns the specific field value.

This means different components viewing the same entity with different lens args get different
scalar values, while sharing the same base entity data — and the memo cache keeps per-lens
results independently without any cross-bucket invalidation.

## Normalized storage

```
entities['Company']['1'] = {
  id: '1',
  price: 100,
  pct_equity: ['1', 'pct_equity', 'Company'],
  shares: ['1', 'shares', 'Company'],
}

entities['Scalar(portfolio)']['Company|1|portfolioA'] = {
  pct_equity: 0.5,
  shares: 32342,
}

entities['Scalar(portfolio)']['Company|1|portfolioB'] = {
  pct_equity: 0.3,
  shares: 323,
}
```

## Related

- [Entity](/rest/api/Entity) — defines the base entity that scalar fields attach to
- [Values](./Values.md) — used for column-only endpoints (dictionary keyed by entity pk)
- [Union](./Union.md) — similar wrapper pattern for polymorphic entities
