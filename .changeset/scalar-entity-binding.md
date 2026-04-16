---
'@data-client/endpoint': patch
---

Fix `Scalar` schema cross-entity contamination and undefined-entity-key bug

`Scalar` previously stored the entity key as mutable instance state (`_entityKey`)
set during the entity-normalize path and read during the Values-normalize and
entity-denormalize paths. This caused two bugs:

1. Two entity types (e.g. `Company` and `Fund`) sharing a single `Scalar` instance
   would overwrite each other's `_entityKey`, producing incorrect compound pks
   during denormalize (e.g. `Fund|1|portfolioA` when resolving a `Company` cell).
2. A Values-only column fetch with no prior entity fetch left `_entityKey`
   `undefined`, producing compound pks like `undefined|1|portfolioB`.

The mutable state has been removed:

- In the entity-attached path, the entity key is read directly from the parent
  `Entity` class and recorded on the wrapper (`{ id, field, entityKey }`) so
  denormalize resolves the correct cell — a single `Scalar` instance can now be
  safely shared across multiple entity types.
- In the standalone path (e.g. inside `schema.Values`), there is no parent
  context, so a new optional `entity` option binds the `Scalar` to an `Entity`
  class. This option is only required for the standalone path; using it
  unnecessarily in the entity-attached path is harmless.
