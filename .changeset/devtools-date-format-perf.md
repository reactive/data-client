---
'@data-client/core': patch
'@data-client/react': patch
'@data-client/vue': patch
---

Fix slow updates in development while Redux DevTools is open

With the [Redux DevTools](https://dataclient.io/docs/getting-started/debugging) extension open, every store update
could stall the page for tens of milliseconds, growing with the number of entities and fetches in the store. Apps doing
many `controller.set()` calls, polling, or live updates would stutter in development. Timestamps in DevTools now
serialize more than 20x faster, and they still show as readable times like `10:42:07.123 AM`.
