---
'@data-client/endpoint': minor
'@data-client/rest': minor
'@data-client/graphql': minor
'@data-client/normalizr': minor
'@data-client/core': minor
'@data-client/react': minor
'@data-client/vue': minor
---

Allow one `Collection` schema to be used both top-level and nested.

Before:

```ts
const getTodos = new Collection([Todo], { argsKey });
const userTodos = new Collection([Todo], { nestKey });
```

After:

```ts
const userTodos = new Collection([Todo], { argsKey, nestKey });
```
