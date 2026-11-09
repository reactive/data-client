---
'@data-client/react': patch
---

Fix [ExternalDataProvider](https://dataclient.io/docs/api/ExternalDataProvider) missing updates dispatched while it mounts

`ExternalDataProvider` (and the `DataProvider` from `@data-client/react/redux`) subscribed to the Redux store after its children's mount Effects ran. Anything those Effects dispatched, like a [`controller.fetch()`](https://dataclient.io/docs/api/Controller#fetch) with an optimistic update, did not render until the next store change. It now renders right away.

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
