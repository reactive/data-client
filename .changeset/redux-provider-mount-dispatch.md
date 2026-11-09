---
'@data-client/react': patch
---

Fix [ExternalDataProvider](https://dataclient.io/docs/api/ExternalDataProvider) missing updates dispatched while it mounts

Under `ExternalDataProvider` or the [Redux `DataProvider`](https://dataclient.io/docs/guides/redux), anything a component dispatched from a mount Effect, like a [`controller.fetch()`](https://dataclient.io/docs/api/Controller#fetch) with an optimistic update, did not render until the next store change. It now renders right away.

```tsx
function Article({ id }: { id: number }) {
  const ctrl = useController();
  useEffect(() => {
    ctrl.fetch(ArticleResource.partialUpdate, { id }, { read: true });
  }, [ctrl, id]);
  // Before: still shows read: false under the Redux provider
  // After: shows read: true right away
  return <ArticleView article={useCache(ArticleResource.get, { id })} />;
}
```

Changes to other Redux reducers no longer re-render data-client consumers while an optimistic update is pending.
