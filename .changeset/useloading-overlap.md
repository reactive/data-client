---
'@data-client/react': patch
'@data-client/vue': patch
---

Fix `useLoading()` when calls overlap

In [React](https://dataclient.io/docs/api/useLoading) and [Vue](https://dataclient.io/vue/api/useLoading), `loading` and `error` now follow the latest call. Before, an earlier call that settled later could set `error` after the latest call succeeded, or set `loading` to `false` while the latest call was still pending.
