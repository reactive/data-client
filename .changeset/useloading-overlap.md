---
'@data-client/react': patch
'@data-client/vue': patch
---

Fix [useLoading()](https://dataclient.io/docs/api/useLoading) when calls overlap

`loading` and `error` now follow the latest call. Before, an earlier call that settled later could set `error` after the latest call succeeded, or set `loading` to `false` while the latest call was still pending.
