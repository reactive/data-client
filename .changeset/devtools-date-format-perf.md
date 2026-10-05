---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix slow updates in development while Redux DevTools is open

With the [Redux DevTools](https://dataclient.io/docs/getting-started/debugging) extension open, every store update
stalled the page while DevTools serialized the store: about 20ms with 50 entities, and 200ms with 500. Apps doing
many `controller.set()` calls, polling, or live updates would stutter in development. Each update now serializes
40-60x faster, and timestamps still show as readable times like `10:42:07.123 AM`.
