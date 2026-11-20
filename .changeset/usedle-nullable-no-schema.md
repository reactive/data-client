---
'@data-client/react': patch
'@data-client/vue': patch
---

Fix `useDLE()` typing `data` as `undefined` for endpoints without a schema when args can be `null`

When an endpoint has no `schema` and its args can be `null` (to skip the fetch), `data` is now typed as the endpoint's resolved value or `undefined`, matching `useSuspense()` and `useCache()`.

```ts
const getTitle = new Endpoint(async ({ id }: { id: number }) => ({
  id,
  title: 'hi',
}));

const { data } = useDLE(getTitle, id === null ? null : { id });
// Before: data is typed as undefined
// After: data is typed as { id: number; title: string } | undefined
data?.title;
```
