---
'@data-client/normalizr': patch
---

React Native: shorter GC pauses with large cached results

On Hermes, an app that kept reading a large result while its entities updated could freeze for 0.5–3s at a time, and the freezes grew the longer it ran. An example is `useSuspense()` on a few thousand entities that join live prices. Each freeze was a garbage collection pause caused by memoization. React Native builds now use a memo that keeps these pauses short.

Trade-off: on React Native, the memo keeps the newest version of each result plus the ones committed renders last read. A read that is not committed and switches between store versions can get a new (equal) object for data it already returned. Web builds do not change.

React Native now loads its own build: `native/` for `import` (Metro) and `dist/normalizr.native.js` for `require` (`@data-client/core` and Jest).
