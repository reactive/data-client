---
'@data-client/normalizr': patch
---

Move entity table POJO clone from getNewEntities to setEntity

Lazy-clone entity and meta tables on first write per entity type instead of eagerly in getNewEntities. This keeps getNewEntities as a pure Map operation, eliminating its V8 Maglev bailout ("Insufficient type feedback for generic named access" on `this.entities`).
