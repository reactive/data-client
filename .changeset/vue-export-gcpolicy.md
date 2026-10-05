---
'@data-client/vue': patch
---

Export `GCPolicy` from `@data-client/vue`

```ts
// Before
import { GCPolicy } from '@data-client/core';
// After
import { GCPolicy } from '@data-client/vue';

app.use(DataClientPlugin, {
  gcPolicy: new GCPolicy({ intervalMS: 60 * 1000 * 10 }),
});
```
