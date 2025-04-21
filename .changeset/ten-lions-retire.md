---
'@data-client/normalizr': patch
'@data-client/core': patch
'@data-client/react': patch
---

Improve performance of get/denormalize for small responses

- 10-20% performance improvement due to removing immutablejs check for every call