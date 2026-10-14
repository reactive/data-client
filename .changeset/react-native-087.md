---
'@data-client/react': patch
---

Support React Native 0.87

React Native 0.87 removed `InteractionManager`, so apps on it crashed as soon as a component called `useSuspense()`, `useFetch()` or `useDLE()`. On 0.87 and later, Data Client now waits for idle time with `requestIdleCallback()`, as React Native recommends. Older React Native versions keep using `InteractionManager`.
