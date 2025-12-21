---
'@data-client/core': patch
'@data-client/react': patch
---

Add mockInitialState to /mock

```ts
import { mockInitialState } from '@data-client/react/mock';
import { ArticleResource } from './resources';

const state = mockInitialState([
  {
    endpoint: ArticleResource.get,
    args: [{ id: 5 }],
    response: { id: 5, title: 'Hello', content: 'World' },
  },
]);
```
