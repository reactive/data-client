---
'@data-client/test': patch
---

Add automatic cleanup after each test

[renderDataHook()](/docs/api/renderDataHook) and `makeRenderDataClient()` now register an `afterEach` hook at import time that automatically cleans up all active managers. Manual `renderDataHook.cleanup()` calls in `afterEach` are no longer needed.

```ts
// Before: ❌
afterEach(() => {
  renderDataHook.cleanup();
});

// After: ✓ (no afterEach needed — cleanup is automatic)
```
