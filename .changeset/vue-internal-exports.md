---
'@data-client/vue': patch
---

Add `__INTERNAL__` export matching `@data-client/react`'s

Tooling built on `@data-client/vue` can now use `createReducer`, `initialState` and friends without also installing `@data-client/core`.
