---
'@data-client/react': minor
'@data-client/vue': minor
---

[useFetch()](/docs/api/useFetch) always returns a stable promise with a `.resolved` property, even when data is already cached.

```tsx
const promise = useFetch(MyResource.get, { id });
promise.resolved; // true if no fetch needed or fetch completed
```

```tsx
const data = use(useFetch(PostResource.get, { id }));
```