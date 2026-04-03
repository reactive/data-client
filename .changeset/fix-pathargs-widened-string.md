---
'@data-client/rest': patch
---

Fix TypeScript for `RestEndpoint` subclasses when the path is inferred as `string`

If you extend `RestEndpoint` with a generic such as `O extends RestGenerics = any`, TypeScript can widen a path literal to `string`. Constructor callbacks like `getOptimisticResponse`, `key`, `url`, and `process` could then get the wrong parameter types (or unusable unions), even though calling the endpoint still worked at runtime.

The same problem could show up when you set `searchParams: undefined` explicitly next to a `body` and a widened path. Both cases now type-check as you would expect.

```typescript
import { Entity } from '@data-client/endpoint';
import { RestEndpoint, RestGenerics } from '@data-client/rest';

class Item extends Entity {
  readonly id = '';
}

class AppRestEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {}

new AppRestEndpoint({
  path: '/items' as string,
  schema: Item,
  body: {} as { name: string },
  getOptimisticResponse(_snap, body) {
    body.name;
    return body;
  },
});

new AppRestEndpoint({
  path: '/search' as string,
  searchParams: undefined,
  schema: Item,
  body: {} as { q: string },
  getOptimisticResponse(_snap, body) {
    body.q;
    return body;
  },
});
```
