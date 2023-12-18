---
"@data-client/normalizr": minor
"@data-client/endpoint": minor
"@data-client/react": minor
"@data-client/core": minor
---

BREAKING CHANGE: `null` inputs are no longer filtered from Array or Object

- `[]` and `schema.Array` now behave in the same manner.
- `null` values are now consistently handled everywhere (being retained).
  - These were already being retained in nested Entities
- `undefined` is still filtered out.
