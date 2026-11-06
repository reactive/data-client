---
'@data-client/normalizr': patch
---

React Native: shorter GC pauses with large cached results

On Hermes, an app that kept reading a large result while its entities updated could freeze for 0.5–3s at a time, and the freezes grew the longer it ran. An example is `useSuspense()` on a few thousand entities that join live prices. Each freeze was a garbage collection pause caused by memoization. React Native builds now use a memo that keeps these pauses short.

Trade-off: on React Native, the memo keeps at most six versions of each result. A read can get a new (equal) object for data it already returned, when five or more other versions of that result were computed since its last read. This can happen with many optimistic updates or transition retries in flight. In stress tests, 0.007% of committed reads did this. Web builds do not change.

React Native now loads its own build: `native/` for `import` (Metro) and `dist/normalizr.native.js` for `require` (`@data-client/core` and Jest).
