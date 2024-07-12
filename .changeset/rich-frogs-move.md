---
'@data-client/normalizr': minor
---

Change normalize() interface

```ts
function normalize(
  schema,
  input,
  args,
  { entities, indexes, entityMeta },
  { date, expiresAt, fetchedAt },
);
```

#### Usage

```ts
const { result, entities, indexes, entityMeta } = normalize(
  action.endpoint.schema,
  payload,
  action.args,
  state,
  action.meta,
);
```

