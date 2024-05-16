---
"@data-client/endpoint": patch
"@data-client/graphql": patch
"@data-client/rest": patch
---

Polymorphic (Union) types should still denormalize when handling passthrough (non-normalized) data

When denormalizing non-normalized (like return of ctrl.fetch), it is still expected to handle
all steps like constructing class instances if possible. However, to do this for Polymorphic
types we need to fallback to using part of the normalize process to find out *which* schema
to use for the remainder of denormalization.