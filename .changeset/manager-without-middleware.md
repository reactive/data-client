---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Clear error for a [Manager](https://dataclient.io/docs/api/Manager) without `middleware`

A Manager must define [middleware](https://dataclient.io/docs/api/Manager#middleware). One without it used to crash
with `manager.middleware is not a function`; in development it now throws an error naming the Manager and linking to
the docs.
