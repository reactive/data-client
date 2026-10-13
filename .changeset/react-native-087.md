---
'@data-client/react': patch
---

Support React Native 0.87

React Native 0.87 removed `InteractionManager`, so apps on it crashed as soon as a component called `useSuspense()`, `useFetch()` or `useDLE()`. Data Client now waits for idle time with `requestIdleCallback()`, which every React Native version provides. Apps on older React Native versions behave the same as before.
