---
'@data-client/normalizr': minor
---

BREAKING CHANGE: Denormalize always transforms immutablejs entities into the class

Previously using ImmutableJS structures when calling denormalize() would maintain
nested schemas as immutablejs structures still. Now everything is converted to normal JS.
This is how the types have always been specified.
