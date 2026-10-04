---
'@data-client/vue': patch
---

Fix `app.use(DataClientPlugin)` throwing `app.onUnmount is not a function` on Vue versions before 3.5

```ts
const app = createApp(App);
// Before (Vue < 3.5): TypeError: app.onUnmount is not a function
// After: installs, and stops the DataClient when the app unmounts
app.use(DataClientPlugin);
```
