---
'@data-client/test': patch
---

Require `@data-client/react` 0.15 or later

`@data-client/test` already needed `@data-client/react/mock`, which first shipped in `@data-client/react` 0.15, so with 0.12–0.14 it failed at import time. Its peer range now says so, and your package manager warns at install instead.

`Fixture`, `Interceptor`, and the other fixture types from `@data-client/test` are now the same types as `@data-client/react/mock` exports, so fixtures typed with either import work everywhere.
