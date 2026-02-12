---
'@data-client/rest': patch
---

Fix `sideEffect: false` type being lost with `method: 'POST'`

`sideEffect` set explicitly now always takes priority over `method` inference,
including through `.extend()` chains. Previously `sideEffect: false` resolved
to `never`, losing type information.

```ts
// Before: sideEffect typed as `never` ❌
const ep = new RestEndpoint({ method: 'POST', sideEffect: false, ... });
// After: sideEffect typed as `false` ✓
const ep = new RestEndpoint({ method: 'POST', sideEffect: false, ... });
```
