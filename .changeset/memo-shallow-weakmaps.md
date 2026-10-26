---
'@data-client/normalizr': patch
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix multi-second freezes on React Native (Hermes) when large results read streaming entities

On Hermes, an app that kept reading a large result while its entities updated could freeze for 0.5–3s at a time, and the freezes grew the longer it ran. An example is `useSuspense()` on a few thousand entities that join live prices. Each freeze was a garbage collection pause caused by memoization. Cached reads no longer slow down Hermes's garbage collector, and they are faster on every platform.
