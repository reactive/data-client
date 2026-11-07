---
'@data-client/vue': patch
---

Fix `@data-client/vue/test` in Jest and Node

`require('@data-client/vue/test')` (Jest's default) threw `Cannot find module '.../dist/test/index.js'`.
Node's `import` loaded the main `@data-client/vue` entry instead, so `mountDataClient`, `renderDataCompose`
and `MockPlugin` were `undefined`. Both now load the test utilities, and they share the main entry's plugin,
so composables in the mounted component get the mock controller.

```ts
import { mountDataClient } from '@data-client/vue/test';

const { wrapper, controller } = mountDataClient(TodoList, {
  initialFixtures: [{ endpoint: TodoResource.getList, args: [], response: todos }],
});
```
