---
'@data-client/vue': patch
---

Fix `useSuspense()`, `useDLE()` and `useFetch()` refetching stale data on every store update

Once data was stale, any store update (such as `controller.set()`) made these composables refetch, so the server
response could overwrite the change. They now only refetch when the data's expiry, the arguments, or a reset changes,
matching `@data-client/react`.

```ts
const article = await useSuspense(ArticleResource.get, { id: 5 });
// ...after the response's dataExpiryLength passes
await ctrl.set(Article, { id: 5 }, { id: 5, title: 'edited' });
// Before: triggers a refetch that reverts title to the server value
// After: title stays 'edited'
```
