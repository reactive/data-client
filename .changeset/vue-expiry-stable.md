---
'@data-client/vue': patch
---

Fix `useDLE()` and `useCache()` dropping expired `invalidIfStale` data on unrelated store updates

After an `invalidIfStale` response expired, any unrelated store update switched these composables to empty data, and
`useDLE()` stayed `loading` without starting a fetch. Expiry is now only re-checked when the response's expiry, the
arguments, or a reset changes, matching `@data-client/react`.

The `vue` peer dependency is now `^3.4.0`.

```ts
const { data, loading } = useDLE(ArticleResource.get, { id: 5 });
// ...after the response's dataExpiryLength passes
await ctrl.setResponse(UserResource.get, { id: 1 }, user);
// Before: loading.value === true, data.value === undefined, and no fetch starts
// After: loading.value === false, data.value is still the article
```
