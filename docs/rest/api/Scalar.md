---
title: Scalar Schema - Lens-Dependent Entity Fields
sidebar_label: Scalar
---

import ScalarDemo from '../shared/\_ScalarDemo.mdx';

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

<ScalarDemo />

On first render, `getCompanies` fetches once to populate the Company entities and
the initial `Scalar(portfolio)` cells. Every later portfolio switch re-denormalizes
from the existing `Collection` entity with the new lens — no network fetch — and
`getPortfolioColumns` fetches only the lens-dependent cells for portfolios the
user actually visits. Revisit a portfolio already in cache and neither endpoint
fires again.

Wrapping lists in [Collection](./Collection.md) is what makes this work:
`Array` has no `queryKey`, so `useSuspense(getCompanies, { portfolio: 'B' })`
would miss the endpoint cache and trigger a refetch. `Collection.queryKey()`
returns its pk when the `Collection` entity is in the store, so the reuse path
fires as long as the pk is stable across the cases you want to share.

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

`getPortfolioColumns` also uses `Collection`, but keeps `portfolio` in its pk
with `argsKey: ({ portfolio }) => ({ portfolio })` because each portfolio has a
distinct column response. `Scalar.entityPk()` derives each cell's Company id
from the array item (delegating to `Company.pk()` by default), so the endpoint
can use the natural REST shape:

```typescript
[
  { id: '1', pct_equity: 0.5, shares: 10000 },
  { id: '2', pct_equity: 0.2, shares: 4000 },
]
```

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

The returned value becomes part of the stored cell key and is also used for
cell lookup during [queryKey](#queryKey). It must be a string that does not
contain `|` — the `|` character is the cpk delimiter
(`entityKey|entityPk|lens`), and a lens containing `|` would collide with
other lenses that share the same trailing segment.

### key: string {#key}

Unique name for this scalar type. This namespaces the internal `Scalar` entity table.

For example, `key: 'portfolio'` stores cells in `Scalar(portfolio)`.

### entity?: Entity {#entity}

Entity class this `Scalar` stores cells for.

This is optional when the scalar is used as a field on `Entity.schema`, where the
parent entity is inferred. It is required for standalone usage such as
`new Values(PortfolioScalar)`.

### entityPk(input, parent, key, args): string | number | undefined {#entityPk}

Derives the bound Entity's primary key when `Scalar` is used standalone, such as
inside `Values`, `[Scalar]`, or `Collection([Scalar])`. The cell's actual pk
stored under `Scalar(key)` is the compound `entityKey|entityPk|lens` — this
method only supplies the `entityPk` piece.

By default `entityPk()`:

- returns the surrounding map `key` when it authoritatively addresses the
  cell — i.e. `parent[key] === input`, as in `Values(Scalar)` where the map
  key is the entity pk and the cell may not carry the pk fields — then
- delegates to the bound `Entity.pk(input, parent, key, args)` static so
  `[Scalar]` and `Collection([Scalar])` array responses — including arrays
  nested under a parent object schema like `{ stock: [Scalar] }`, and
  custom or composite Entity pks — work out of the box.

Override `entityPk()` in a subclass only when the response uses an id field the
`Entity.pk()` does not read:

```typescript
class CompanyIdScalar extends Scalar {
  entityPk(input: any) {
    return input.companyId;
  }
}
```

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

### queryKey {#queryKey}

`Scalar` is a [Queryable](/rest/api/schema#queryable) schema. When used as a
top-level endpoint schema — or passed to [useQuery](/docs/api/useQuery),
[Controller.get](/docs/api/Controller#get), [schema.Query](./Query.md), or any
other Queryable consumer — it reports the cpks of all cells whose lens matches
the current args:

- Returns an array of compound pks on hit.
- Returns `undefined` when the lens is `undefined`, the table is missing, or
  no cell matches the current lens.

The common case — `Scalar` nested as an `Entity.schema` field — never reaches
this method. Denormalization goes through the parent entity, so `queryKey`
is only consulted when `Scalar` is itself the root schema being queried.

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
- [Queryable](/rest/api/schema#queryable) — Scalar participates in [useQuery](/docs/api/useQuery), [Controller.get](/docs/api/Controller#get), and [schema.Query](./Query.md)
