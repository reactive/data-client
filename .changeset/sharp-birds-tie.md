---
'@data-client/normalizr': minor
---

Change denormalize() interface

```ts
function denormalize(schema, input, entities, args);
```

#### Usage

```ts
const value = denormalize(endpoint.schema, input, state.entities, args);
```
