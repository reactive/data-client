---
'@data-client/vue': patch
---

Fix `DataClientPlugin` never garbage collecting by default

Without a `gcPolicy` option, data was kept in the store forever. It now defaults to `new GCPolicy()`, matching
`DataProvider` in `@data-client/react`: data no component uses is removed once it is stale.

```ts
app.use(DataClientPlugin);
// Before: unused data stays in the store forever
// After: unused data is removed after it goes stale (swept every 5 minutes)
```
