---
'@data-client/endpoint': minor
'@data-client/rest': minor
'@data-client/graphql': minor
'@data-client/normalizr': minor
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': minor
---

Add [Scalar](https://dataclient.io/rest/api/Scalar) schema for lens-dependent entity fields.

`Scalar` models entity fields whose values vary by a runtime "lens" (such as the
selected portfolio, currency, or locale). Multiple components can render the
same entity through different lenses simultaneously — each sees the correct
values without the entity itself ever being mutated. Lens-dependent values are
stored in a separate cell table and joined at denormalize time from endpoint
args.

New exports: `Scalar`, `schema.Scalar`.

A single `Scalar` instance can serve both as an `Entity.schema` field (parent
entity inferred from the visit) and standalone — inside `Values(Scalar)`,
`[Scalar]`, or `Collection([Scalar])` — for cheap column-only refreshes
(entity bound explicitly via `entity`). Cell pks are derived from the map key
or via `Scalar.entityPk()`, which defaults to `Entity.pk()` so custom and
composite primary keys work with no override:

```ts
import { Collection, Entity, RestEndpoint, Scalar } from '@data-client/rest';

class Company extends Entity {
  id = '';
  price = 0;
  pct_equity = 0;
  shares = 0;
}
const PortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
  entity: Company,
});
Company.schema = {
  pct_equity: PortfolioScalar,
  shares: PortfolioScalar,
};

// Full load — Company rows + scalar cells for the current portfolio
export const getCompanies = new RestEndpoint({
  path: '/companies',
  searchParams: {} as { portfolio: string },
  schema: new Collection([Company], { argsKey: () => ({}) }),
});
// Lens-only refresh — writes to the same Scalar(portfolio) cell table
export const getPortfolioColumns = new RestEndpoint({
  path: '/companies/columns',
  searchParams: {} as { portfolio: string },
  schema: new Collection([PortfolioScalar], {
    argsKey: ({ portfolio }) => ({ portfolio }),
  }),
});
```

`useSuspense(getCompanies, { portfolio: 'A' })` and
`useSuspense(getCompanies, { portfolio: 'B' })` resolve to different
`pct_equity` / `shares` while sharing the same `Company` row.

`Scalar.queryKey` enumerates cells in its table for the current lens, so
endpoints that use `Scalar` directly as their top-level schema reconstruct
from cache without a network round-trip once the cells are present.
