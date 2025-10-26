---
'@data-client/vue': minor
---

Never wrap renderDataCompose().result in ref. Just passthrough the return value directly. Always.

### Before
```ts
const { result, cleanup } = await renderDataCompose(() =>
  useSuspense(CoolerArticleResource.get, { id: payload.id }),
);

const articleRef = await result.value;
expect(articleRef.value.title).toBe(payload.title);
expect(articleRef.value.content).toBe(payload.content);
```

### After
```ts
const { result, cleanup } = await renderDataCompose(() =>
  useSuspense(CoolerArticleResource.get, { id: payload.id }),
);

const articleRef = await result;
expect(articleRef.value.title).toBe(payload.title);
expect(articleRef.value.content).toBe(payload.content);
```