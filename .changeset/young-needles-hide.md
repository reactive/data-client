---
'@data-client/core': patch
---

Add NetworkManager.idleCallback overridable method

This allows platform specific implementations by overriding the method.
For instance, on web:

```ts
import { NetworkManager } from '@data-client/core';

export default class WebNetworkManager extends NetworkManager {
  static {
    if (typeof requestIdleCallback === 'function') {
      WebNetworkManager.prototype.idleCallback = requestIdleCallback;
    }
  }
}
```