---
title: Scalar Schema - Lens-Dependent Entity Fields
sidebar_label: Scalar
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';

# Scalar

`Scalar` describes [Entity](./Entity.md) fields whose values depend on endpoint args,
such as portfolio-, currency-, or locale-specific columns on the same row.

Use `Scalar` when the field belongs to an entity, but its value changes based on a
"lens" selected by the request. Multiple components can render the same entity with
different lens args at the same time, each receiving the correct scalar values.

- `lens`: **required** Selects the lens value from endpoint args.
- `key`: **required** Namespaces this scalar's internal table.
- `entity`: Binds the scalar to an `Entity` when it is used outside of an
  `Entity.schema` field.

::::note

`Scalar` is for scalar values like numbers, strings, booleans, or date-derived values.
Use normal nested [schemas](./schema.md) for relationships to other entities.

::::

## Usage

In this example, `pct_equity` and `shares` depend on the selected portfolio, while
`name` and `price` are stable properties of the `Company` entity.

<HooksPlayground row groupId="schema" defaultOpen="y" fixtures={[
  {
    endpoint: new RestEndpoint({ path: '/companies', searchParams: {} }),
    args: [{ portfolio: 'A' }],
    response: [
      {
        id: '1',
        name: 'Acme Corp',
        price: 145.20,
        pct_equity: 0.50,
        shares: 10000,
      },
      {
        id: '2',
        name: 'Globex',
        price: 89.50,
        pct_equity: 0.20,
        shares: 4000,
      },
      {
        id: '3',
        name: 'Initech',
        price: 32.10,
        pct_equity: 0.10,
        shares: 2500,
      },
    ],
    delay: 150,
  },
  {
    endpoint: new RestEndpoint({ path: '/companies', searchParams: {} }),
    args: [{ portfolio: 'B' }],
    response: [
      {
        id: '1',
        name: 'Acme Corp',
        price: 145.20,
        pct_equity: 0.30,
        shares: 6000,
      },
      {
        id: '2',
        name: 'Globex',
        price: 89.50,
        pct_equity: 0.40,
        shares: 8000,
      },
      {
        id: '3',
        name: 'Initech',
        price: 32.10,
        pct_equity: 0.05,
        shares: 1200,
      },
    ],
    delay: 150,
  },
  {
    endpoint: new RestEndpoint({ path: '/companies/columns', searchParams: {} }),
    args: [{ portfolio: 'A' }],
    response: {
      '1': { pct_equity: 0.50, shares: 10000 },
      '2': { pct_equity: 0.20, shares: 4000 },
      '3': { pct_equity: 0.10, shares: 2500 },
    },
    delay: 150,
  },
  {
    endpoint: new RestEndpoint({ path: '/companies/columns', searchParams: {} }),
    args: [{ portfolio: 'B' }],
    response: {
      '1': { pct_equity: 0.30, shares: 6000 },
      '2': { pct_equity: 0.40, shares: 8000 },
      '3': { pct_equity: 0.05, shares: 1200 },
    },
    delay: 150,
  },
]}>

```ts title="api/Company" {17-20,24-28,34} collapsed
import { Collection, Entity, RestEndpoint, Scalar, Values } from '@data-client/rest';

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
  // `portfolio` is a lens, not a filter — the returned Company list is the same
  // regardless of lens. Excluding it from `argsKey` collapses every portfolio
  // to one Collection pk, so `Collection.queryKey()` finds the list on every
  // switch and `useSuspense` reuses it without refetching.
  schema: new Collection([Company], { argsKey: () => ({}) }),
});

export const getPortfolioColumns = new RestEndpoint({
  path: '/companies/columns',
  searchParams: {} as { portfolio: string },
  schema: new Values(PortfolioScalar),
});
```

```tsx title="PortfolioGrid"
import { useSuspense, useFetch } from '@data-client/react';
import { getCompanies, getPortfolioColumns } from './api/Company';

function PortfolioGrid() {
  const [portfolio, setPortfolio] = React.useState('A');
  // Fetches on first render, then re-denormalizes from cache on every
  // portfolio switch. The Collection's `queryKey()` ignores `portfolio`,
  // so there is no endpoint refetch on switch.
  const companies = useSuspense(getCompanies, { portfolio });
  // The first render's `useSuspense` already populated `Scalar(portfolio)`
  // for `firstPortfolio`, so we only fetch columns when the user switches
  // away. `useFetch` then dedupes later revisits via its endpoint cache.
  const firstPortfolio = React.useRef(portfolio).current;
  useFetch(
    getPortfolioColumns,
    portfolio === firstPortfolio ? null : { portfolio },
  );

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
              <td align="right">{formatPercent(c.pct_equity)}</td>
              <td align="right">{formatShares(c.shares)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatPercent(value: number | undefined) {
  return value === undefined ? 'loading...' : `${(value * 100).toFixed(1)}%`;
}

function formatShares(value: number | undefined) {
  return value === undefined ? 'loading...' : value.toLocaleString();
}

render(<PortfolioGrid />);
```

</HooksPlayground>

On first render, `getCompanies` fetches once to populate the Company entities and
the initial `Scalar(portfolio)` cells. Every later portfolio switch re-denormalizes
from the existing `Collection` entity with the new lens — no network fetch — and
`getPortfolioColumns` fetches only the lens-dependent cells for portfolios the
user actually visits. Revisit a portfolio already in cache and neither endpoint
fires again.

Wrapping `[Company]` in a [Collection](./Collection.md) is what makes this work:
`Array` has no `queryKey`, so `useSuspense(getCompanies, { portfolio: 'B' })`
would miss the endpoint cache and trigger a refetch. `Collection.queryKey()`
returns its pk when the `Collection` entity is in the store, so the reuse path
fires as long as the pk is stable across lens changes.

Here [`argsKey: () => ({})`](./Collection.md#argsKey) forces every portfolio to
the same `pk`, so one Collection entity serves all lenses. When an endpoint has
real filter args alongside the lens, keep the filters in the pk and drop only
the lens:

```typescript
new Collection([Company], {
  argsKey: ({ portfolio, ...filters }) => filters,
});
```

[`nonFilterArgumentKeys`](./Collection.md#nonFilterArgumentKeys) is a separate
concern — it controls which args are ignored when a mutation like `push` or
`assign` matches existing collections — and does _not_ collapse pks. Use it for
sort or pagination args where results differ per value (distinct pks) but
creates should still reach every variant.

### Entity Fields

Use `Scalar` in an `Entity.schema` field when lens-dependent values arrive as part
of the entity response.

```typescript
import { Collection, Entity, RestEndpoint, Scalar } from '@data-client/rest';

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

const getCompanies = new RestEndpoint({
  path: '/companies',
  searchParams: {} as { portfolio: string },
  schema: new Collection([Company], { argsKey: () => ({}) }),
});
```

A single unbound `Scalar` instance can be shared across multiple entity classes.
When used as an `Entity.schema` field, the parent entity is inferred during
normalization.

### Values Endpoint

Use [Values](./Values.md) when an endpoint returns only the scalar columns, keyed by
entity pk. Since this response has no enclosing entity schema, pass `entity` when
constructing the `Scalar`.

```typescript
import { Entity, RestEndpoint, Scalar, Values } from '@data-client/rest';

const CompanyPortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
  entity: Company,
});

const getPortfolioColumns = new RestEndpoint({
  path: '/companies/columns',
  searchParams: {} as { portfolio: string },
  schema: new Values(CompanyPortfolioScalar),
});

// Response: { '1': { pct_equity: 0.5, shares: 32342 }, '2': { ... } }
```

Column-only endpoints write `Scalar(portfolio)` cells without modifying the
`Company` entities. A bound `Scalar` can still be used as an `Entity.schema` field;
the inferred parent entity takes precedence there.

## Options

```typescript
new Scalar({ lens, key, entity? })
```

### lens(args): string | undefined {#lens}

Selects the lens value from endpoint args, such as a portfolio ID.

The lens value must be present when normalizing a response. Returning `undefined`
during normalize throws because the scalar cell cannot be stored under a retrievable
key. During denormalize, a missing lens returns `undefined` for that field.

### key: string {#key}

Unique name for this scalar type. This namespaces the internal `Scalar` entity table.

For example, `key: 'portfolio'` stores cells in `Scalar(portfolio)`.

### entity?: Entity {#entity}

Entity class this `Scalar` stores cells for.

This is optional when the scalar is used as a field on `Entity.schema`, where the
parent entity is inferred. It is required for standalone usage such as
`new Values(PortfolioScalar)`.

## Behavior

### Normalize

When normalizing an entity response, `Scalar` stores the field value in a separate
cell keyed by:

```text
entityKey|entityPk|lensValue
```

The entity row keeps a lens-independent reference to that cell. This lets one
entity row point to different scalar values depending on the current endpoint args.

When normalizing a `Values` response, each top-level key is treated as the entity pk,
and the response value is stored as that entity's scalar cell for the current lens.

### Denormalize

During denormalization, `Scalar` reads the current lens from endpoint args and looks
up the matching cell. If no matching lens or cell exists, the field denormalizes to
`undefined`.

Because the lens participates in denormalization memoization, separate portfolio,
currency, or locale views cache independently while sharing the same base entity
data.

### Normalized Storage

```typescript
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
