---
'@data-client/react': patch
'@data-client/vue': patch
'@data-client/core': patch
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
---

[useQuery()](https://dataclient.io/docs/api/useQuery) accepts `null` to skip the query, like the other hooks

It returns `undefined` until you pass real args. This already worked at runtime; now TypeScript accepts it.

```ts
const todo = useQuery(Todo, id ? { id } : null);
```

[Controller.get()](https://dataclient.io/docs/api/Controller#get), `Controller.getQueryMeta()` and their [Snapshot](https://dataclient.io/docs/api/Snapshot) versions accept `null` the same way.
