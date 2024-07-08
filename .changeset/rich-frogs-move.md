---
'@data-client/normalizr': minor
---

Change normalize() interface

```ts
function normalize(
  schema,
  input,
  { date, expiresAt, fetchedAt, args },
  { entities, indexes, entityMeta },
);
```

#### Usage

```ts
const { result, entities, indexes, entityMeta } = normalize(
  action.endpoint.schema,
  payload,
  action.meta,
  state,
);
```

