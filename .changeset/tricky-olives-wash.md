---
'@data-client/vue': minor
---

Add useDLE()

```ts
const { date, loading, error } = useDLE(
  CoolerArticleResource.get,
  computed(() => (props.id !== null ? { id: props.id } : null)),
);
```