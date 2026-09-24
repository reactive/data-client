---
'@data-client/test': patch
---

Fix mount effects when `renderDataHook()` suspends on the first render

`renderDataHook()` and `makeRenderDataHook()` now run provider mount effects when the first render suspends, including `use(useFetch())`. The hook result stays unresolved until the data arrives.
