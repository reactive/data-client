---
'@data-client/react': minor
---

CacheProvider elements no longer share default managers

New export: `getDefaultManagers()`

BREAKING CHANGE: Newly mounted CacheProviders will have new manager
objects when default is used