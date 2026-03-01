---
'@data-client/react': major
'@data-client/vue': major
---

BREAKING CHANGE: [useFetch()](/docs/api/useFetch) always returns a stable promise with a `.resolved` property, even when data is already cached.

#### before

```tsx
const promise = useFetch(MyResource.get, { id });
if (promise) {
  // fetch was triggered
}
```

#### after

```tsx
const promise = useFetch(MyResource.get, { id });
if (!promise.resolved) {
  // fetch is in-flight
}
use(promise); // works with React.use()
```