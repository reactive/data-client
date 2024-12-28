---
'@data-client/rest': patch
---

Resource.extend() compatibility with TypeScript 5

Previously [extending existing members](https://dataclient.io/rest/api/resource#extend-override) with no
typed overrides (like [path](https://dataclient.io/rest/api/resource#path)) would not work starting with
TypeScript 5.7.

```ts
const UserResource = UserResourceBase.extend({
  partialUpdate: {
    getOptimisticResponse(snap, params, body) {
      params.id;
      params.group;
      // @ts-expect-error
      params.nothere;
      return {
        id: params.id,
        ...body,
      };
    },
  },
});
```