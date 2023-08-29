---
'@data-client/react': minor
'@data-client/redux': minor
---

Remove makeCacheProvider

Current testing version is already [using the provider Component directly](https://dataclient.io/docs/api/makeRenderRestHook)

```tsx
import { CacheProvider } from '@data-client/react';
const renderDataClient = makeRenderDataClient(CacheProvider);
```