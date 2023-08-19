---
'@data-client/rest': patch
'@rest-hooks/rest': patch
---

Fix Resource.extend() for builtin endpoints with zero typing options

```ts
const RatingResource = createResource({
  path: '/ratings/:id',
  schema: Rating,
}).extend({
  getList: {
    dataExpiryLength: 10 * 60 * 1000, // 10 minutes
  },
});
```

This would previously break the types of RatingResource.getList.
This would only occur because dataExpiryLength is not a type-influencing option.