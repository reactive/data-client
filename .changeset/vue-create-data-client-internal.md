---
'@data-client/vue': patch
---

`createDataClient()` and `ProvidedDataClient` are deprecated

They only exist to implement [DataClientPlugin](https://dataclient.io/vue/api/DataClientPlugin) and will stop being
exported in a future release. Nothing changes at runtime. If you call `createDataClient()` directly, install the
plugin instead and read the controller with [useController()](https://dataclient.io/vue/api/useController).

```ts title="main.ts"
import { DataClientPlugin } from '@data-client/vue';

app.use(DataClientPlugin, { managers, initialState });
```
