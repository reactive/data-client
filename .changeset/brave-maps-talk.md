---
"@data-client/normalizr": minor
"@data-client/endpoint": patch
"@data-client/react": patch
"@data-client/core": patch
"@data-client/rest": patch
---

Fix schema.All denormalize INVALID case should also work when class name mangling is performed in production builds

- `unvisit()` always returns `undefined` with `undefined` as input.
- `All` returns INVALID from `infer()` to invalidate what was previously a special case in `unvisit()` (when there is no table entry for the given entity)