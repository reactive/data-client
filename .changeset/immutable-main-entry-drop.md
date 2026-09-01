---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
'@data-client/rest': minor
'@data-client/graphql': minor
'@data-client/react': minor
'@data-client/vue': minor
---

BREAKING CHANGE: ImmutableJS input is no longer supported by the default (main-entry) denormalize

Denormalizing normalized data that contains ImmutableJS `Map`/`Record` values
now requires the `/imm` entry points. The default `denormalize` and
`MemoCache` assume plain-object values, removing a per-object check from the
hot path and all ImmutableJS support code from the main bundles. In
development, passing immutable input to the default denormalize now throws a
descriptive error instead of silently producing corrupt output.

ImmutableJS v4 or later is required: detection of legacy v3 Records (which
kept their values on an internal `_map`) has been removed.

Immutable *state tables* already required `@data-client/normalizr/imm` since
v0.15 — that usage is unchanged and continues to support immutable results:

#### Before

```ts
import { denormalize } from '@data-client/normalizr';
import { fromJS } from 'immutable';

denormalize({ data: Article }, fromJS({ data: '1' }), entities);
```

#### After

```ts
import { denormalize } from '@data-client/normalizr/imm';
import { fromJS } from 'immutable';

denormalize({ data: Article }, fromJS({ data: '1' }), entities);
```

Alternatively, convert values to plain objects before denormalizing with the
main entry.

For custom schemas: `Polymorphic.denormalizeValue(value, unvisit)` is now
`denormalizeValue(value, delegate)` — pass the delegate your `denormalize`
receives instead of `delegate.unvisit`.

New exports:

- `PlainValuePolicy` from `@data-client/normalizr` — default plain-object value handling
- `ImmValuePolicy` from `@data-client/normalizr/imm` — ImmutableJS-aware value handling
- `IValuePolicy` (type) — implement to customize value handling in a `MemoCache` policy
