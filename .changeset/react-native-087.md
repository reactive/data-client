---
'@data-client/react': patch
---

Support React Native 0.87

React Native 0.87 removed `InteractionManager`, so apps on it crashed as soon as a component called `useSuspense()`, `useFetch()` or `useDLE()`. Data Client now waits for idle time with `requestIdleCallback()` on every React Native version, as React Native recommends. On 0.86 and earlier, `InteractionManager` only delayed work to the next tick, so background fetches and garbage collection still run at about the same time.
