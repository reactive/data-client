---
'@data-client/test': patch
---

Fix `result`, `rerender` and `unmount` missing after spreading a `renderDataHook()` result

`{ ...renderDataHook(...) }` now keeps every member.
