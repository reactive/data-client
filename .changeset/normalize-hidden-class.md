---
'@data-client/normalizr': patch
---

Avoid hidden class mutation in normalize() return object

The normalize result object was constructed with `result: '' as any` then mutated via `ret.result = visit(...)`, causing a V8 hidden class transition when the property type changed from string to the actual result type. Restructured to compute the result first and construct the final object in a single step.
