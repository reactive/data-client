---
'@data-client/normalizr': patch
---

Replace megamorphic computed dispatch in getDependency with switch

`getDependency` used `delegate[array[index]](...spread)` which creates a temporary array, a computed property lookup, and a spread call on every invocation — a megamorphic pattern that prevents V8 from inlining or type-specializing the call site. Replaced with a `switch` on `path.length` for monomorphic dispatch.
