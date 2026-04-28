---
'@data-client/normalizr': patch
'@data-client/core': patch
'@data-client/endpoint': patch
'@data-client/rest': patch
'@data-client/graphql': patch
'@data-client/react': patch
---

Fix cached journey being mutated on repeated result-cache hits.

`GlobalCache.getResults` called `paths.shift()` on a cache hit, mutating
the `journey` array stored by reference on the `WeakDependencyMap` `Link`
node. After the first hit stripped the placeholder input slot, every
subsequent hit on the same cached entry would shift off a real
`EntityPath`, progressively losing subscription entries. This could cause
missed `countRef` tracking (premature GC of still-referenced entities)
and incorrect `entityExpiresAt` calculations. The hit path now returns a
non-mutating copy.
