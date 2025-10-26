---
'@data-client/vue': minor
---

`renderDataCompose()` awaits until the composable runs

### Before

```ts
const { result, cleanup } = renderDataCompose(() =>
  useCache(CoolerArticleResource.get, { id: payload.id }),
);

// Wait for initial render
await waitForNextUpdate();

expect(result.current).toBeDefined();
```

### After

```ts
const { result, cleanup } = await renderDataCompose(() =>
  useCache(CoolerArticleResource.get, { id: payload.id }),
);

expect(result.value).toBeDefined();
```