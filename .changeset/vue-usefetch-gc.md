---
'@data-client/vue': patch
---

Vue `useFetch()` keeps its response from being garbage collected while mounted, like React `useFetch()` and Vue `useSuspense()`
