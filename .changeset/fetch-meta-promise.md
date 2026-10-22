---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Type FETCH `action.meta.promise` as `Promise`

Managers can now call `.finally()` and `.catch()` on a FETCH action's `meta.promise` without a TypeScript error. It was always a real `Promise` at runtime, but was typed `PromiseLike`, which only has `.then()`.

```ts
// Before: TypeScript error on .finally(), so both callbacks went to .then()
const track = () =>
  trackTiming(action.endpoint.name, performance.now() - start);
action.meta.promise.then(track, track);

// After
action.meta.promise
  .finally(() => {
    trackTiming(action.endpoint.name, performance.now() - start);
  })
  // the fetch's caller handles errors; this only observes timing
  .catch(() => {});
```
