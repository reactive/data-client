---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix crash with Managers that don't define `middleware`

[Manager](https://dataclient.io/docs/api/Manager) types `middleware` as optional, but a Manager that only used
[init()](https://dataclient.io/docs/api/Manager#init) and [cleanup()](https://dataclient.io/docs/api/Manager#cleanup)
threw `manager.middleware is not a function` when the provider mounted. Actions now pass through it unchanged, so you
can drop the pass-through middleware you added to work around it:

```ts
import type { Manager, Middleware } from '@data-client/react';

class AnalyticsManager implements Manager {
  init() {
    analytics.start();
  }
  cleanup() {
    analytics.stop();
  }
  // no longer needed
  middleware: Middleware = () => next => next;
}
```
