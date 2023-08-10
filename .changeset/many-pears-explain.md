---
'@data-client/react': minor
'@data-client/core': minor
'@rest-hooks/core': minor
'@rest-hooks/react': minor
---

Add controller.expireAll() that sets all responses to *STALE*

```ts
controller.expireAll(ArticleResource.getList);
```

This is like controller.invalidateAll(); but will continue showing
stale data while it is refetched.

This is sometimes useful to trigger refresh of only data presently shown
when there are many parameterizations in cache.