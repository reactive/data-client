---
'@data-client/react': patch
---

Add /ssr entrypoint - eliminating the need for @data-client/ssr package completely

```ts
import {
  createPersistedStore,
  createServerDataComponent,
} from '@data-client/react/ssr';
```
