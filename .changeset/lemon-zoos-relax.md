---
"@data-client/rest": minor
---

Add RestEndpoint.searchToString()

For example:

To encode complex objects in the searchParams, you can use the [qs](https://github.com/ljharb/qs) library.

```typescript
import { RestEndpoint, RestGenerics } from '@data-client/rest';
import qs from 'qs';

class MyEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  searchToString(searchParams) {
    return qs.stringify(searchParams);
  }
}
```