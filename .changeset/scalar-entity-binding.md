---
'@data-client/endpoint': minor
'@data-client/rest': minor
'@data-client/graphql': minor
---

Add [Scalar](https://dataclient.io/rest/api/Scalar) schema for lens-dependent entity fields.

`Scalar` models entity fields whose values vary by a runtime "lens" (such as the
selected portfolio, currency, or locale). Multiple components can render the
same entity through different lenses simultaneously — each sees the correct
values without the entity itself ever being mutated. Lens-dependent values are
stored in a separate cell table and joined at denormalize time from endpoint
args.

New exports: `Scalar`, `schema.Scalar`.

#### Use as an `Entity.schema` field

Declare which fields are lens-dependent. A single `Scalar` instance can be
shared across multiple `Entity` classes — the parent entity is recorded on
each wrapper, so denormalize always resolves the correct cell.

```ts
import { Entity, Scalar } from '@data-client/rest';

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

`useSuspense(getCompanies, { portfolio: 'A' })` and
`useSuspense(getCompanies, { portfolio: 'B' })` resolve to different
`pct_equity` / `shares` while sharing the same `Company` row in the cache.

#### Use standalone for column-only endpoints

When fetching only the lens-dependent columns (no entity refresh), wrap the
`Scalar` in `schema.Values`. The standalone path has no parent entity to
infer from, so bind the `Scalar` to an `Entity` class via the `entity`
option:

```ts
import { Endpoint, schema, Scalar } from '@data-client/rest';

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

A bound `Scalar` is also valid as an `Entity.schema` field, so a single
instance can serve both endpoints.
