---
'@data-client/test': patch
---

Add renderDataHook() export

This can be used instead of `makeRenderDataHook(DataProvider)`

```ts
import { renderDataHook } from '@data-client/test';

const { result, waitFor } = renderDataHook(
  () => {
    return useSuspense(ArticleResource.get, { id: 5 });
  },
  {
    initialFixtures: [
      {
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        response,
      },
    ],
  },
);
```