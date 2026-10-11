---
'@data-client/vue': patch
---

`DataClientPlugin` garbage collects by default

Previously, unused data was only removed from the store if you passed a `gcPolicy` yourself. It now defaults
to `new GCPolicy()`, matching `DataProvider` in `@data-client/react`, so you can drop the option unless you
customize it.

Before

```ts
import { DataClientPlugin, GCPolicy } from '@data-client/vue';

app.use(DataClientPlugin, { gcPolicy: new GCPolicy() });
```

After

```ts
import { DataClientPlugin } from '@data-client/vue';

app.use(DataClientPlugin);
```
