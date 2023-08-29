---
'@data-client/normalizr': minor
'@data-client/endpoint': minor
'@data-client/react': minor
'@data-client/core': minor
---

BREAKING CHANGES:

- DELETE removed -> INVALIDATE
- drop all support for legacy schemas
  - entity.expiresAt removed
  - Collections.infer does entity check
  - all Entity overrides for backcompat are removed - operates just like EntitySchema, except with extra validation